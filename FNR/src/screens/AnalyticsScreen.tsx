import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ScrollView, View, StyleSheet, Dimensions, RefreshControl, TextInput } from 'react-native';
import { Card, Text, Button, Snackbar, ActivityIndicator, useTheme } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Heatmap, Marker } from 'react-native-maps';
import { supabase } from '../services/supabase';
import SettingsModal from './SettingsScreen';
import GlobalFunctions from '../utils/globalFunctions';
import { AppColors } from '../theme/colors';

export default function AnalyticsScreen() {
  const theme = useTheme();
  const appColors = theme.colors as unknown as AppColors;
  const styles = useMemo(() => getAnalyticsStyles(appColors), [appColors]);

  // --- KPI Tile ---
  const KPI = ({ label, value }: { label: string; value: string | number }) => (
    <Card style={styles.kpiCard}>
      <Card.Content>
        <Text variant="labelLarge">{label}</Text>
        <Text variant="displaySmall" style={styles.kpiValue}>{value}</Text>
      </Card.Content>
    </Card>
  );

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [stats, setStats] = useState({
    totalInspections: 0,
    lastInspectionDate: null as Date | null,
  });
  const [naturalnessPieData, setNaturalnessPieData] = useState<any[]>([]);
  const [sitePieData, setSitePieData] = useState<any[]>([]);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [points, setPoints] = useState<any[]>([]);
    const [keyword, setKeyword] = useState('');
    const [showNames, setShowNames] = useState(false);
    const [region, setRegion] = useState({
      latitude: 53.5461,
      longitude: -113.4938,
      latitudeDelta: 5,
      longitudeDelta: 5,
    });

  // saving settings
  const handleSettingsSaved = (newDays: number) => {
    console.log(`Settings saved: Auto-delete set to ${newDays} days`);
  }

  // open settings modal
  const openSettings = () => {
    setSettingsModalVisible(true);
  };

  // assign the openSettings function to the global object
  useEffect(() => {
    GlobalFunctions.openSettingsModal = openSettings;
    return () => {
      GlobalFunctions.openSettingsModal = undefined;
    };
  }, [openSettings]);
  
  
  // Get "x days ago" text
  const getTimeAgo = (date: Date | null) => {
    if (!date) return 'Not Available';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setLoading(true);

    try {
      // call Supabase RPC
      const { data, error } = await supabase.rpc('get_heatmap_data', { keyword });

      if (error) throw error;
      if (!data || data.length === 0) {
        console.warn('No results found for:', keyword);
        setPoints([]);
        return;
      }

      console.log('Keyword matches:', data);

      // fetch coordinates for each namesite using OpenCage
      const sitesWithCoords = await Promise.all(
        data.map(async (site: { namesite: string; count: number }) => {
          const coords = await getCoordinatesFromName(site.namesite);
          if (coords) {
            return {
              latitude: coords.latitude,
              longitude: coords.longitude,
              weight: site.count,
              namesite: site.namesite,
            };

          } else {
            console.warn(`No coordinates for ${site.namesite}`);
            return null;
          }
        })
      );

      // filter out sites with no coordinates
      const validPoints = sitesWithCoords.filter((p) => p !== null);
      setPoints(validPoints);

      console.log('Final Heatmap Points:', validPoints);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Supabase analytics
  const fetchStats = async () => {
    setLoading(true);
    try {
      const { count: detailCount, error: detailError } = await supabase
        .from('sites_report_fnr_test')
        .select('namesite', { count: 'exact', head: false });
      if (detailError) throw detailError;

      const { data: lastRows, error: lastError } = await supabase
        .from('sites_report_fnr_test')
        .select('inspectdate')
        .order('inspectdate', { ascending: false })
        .limit(1);
      if (lastError) throw lastError;

      const { data: naturalnessData, error: rpcError } = await supabase.rpc('get_naturalness_distribution');
      if (rpcError) throw rpcError;

      const { data: topSites, error: topError } = await supabase.rpc('get_top_sites_distribution');
      if (topError) throw topError;

      const colors = ['#999999', '#4caf50', '#2196f3', '#1976d2', '#81c784', '#ff9800', '#f44336', '#ffb74d'];

      setStats({
        totalInspections: detailCount || 0,
        lastInspectionDate: lastRows?.[0]?.inspectdate ? new Date(lastRows[0].inspectdate) : null,
      });

      setNaturalnessPieData(
        (naturalnessData || []).map((item: any, i: number) => ({
          name: item.naturalness_score || 'Unknown',
          count: item.count,
          color: colors[i % colors.length],
          legendFontColor: appColors.text,
          legendFontSize: 12,
        }))
      );

      setSitePieData(
        (topSites || []).map((item: any, i: number) => ({
          name: item.namesite || 'Other',
          count: item.count,
          color: colors[i % colors.length],
          legendFontColor: appColors.text,
          legendFontSize: 12,
        }))
      );

      setToast('Analytics updated!');
    } catch (err: any) {
      console.error('Error fetching stats:', err.message || 'Unknown error');
      setToast('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  // Refresh when screen focused
  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  // Manual sync button
  const syncNow = async () => {
    await fetchStats();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStats} colors={[appColors.primary]} tintColor={appColors.primary} />}
      >
        <Text variant="headlineSmall" style={{ marginBottom: 12, color: appColors.text }}>
          Analytics Overview
        </Text>

        {/* KPIs */}
        <View style={{ marginBottom: 8 }}>
          <Card style={styles.kpiCard}>
            <Card.Content>
              <Text variant="labelLarge" style={{ color: appColors.textSecondary }}>Total Sites Inspected</Text>
              <Text variant="displaySmall" style={styles.kpiValue}>{stats.totalInspections}</Text>
            </Card.Content>
          </Card>
        </View>
        <View style={{ marginBottom: 8 }}>
          <Card style={styles.kpiCard}>
            <Card.Content>
              <Text variant="labelLarge" style={{ color: appColors.textSecondary }}>Last Inspection</Text>
              <Text variant="displaySmall" style={styles.kpiValue}>{stats.lastInspectionDate ? getTimeAgo(stats.lastInspectionDate) : 'Not Available'}</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Charts */}
        <Card style={styles.chartCard}>
          <Text variant="titleMedium" style={{ marginBottom: 12, color: appColors.text }}>Naturalness Score Distribution</Text>
          {naturalnessPieData.length > 0 ? (
            <PieChart
              data={naturalnessPieData.map(item => ({ ...item, legendFontColor: appColors.text }))}
              width={Dimensions.get('window').width - 64}
              height={220}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              chartConfig={{
                color: (opacity = 1) => appColors.text,
              }}
              absolute
            />
          ) : (
            <Text style={{ color: appColors.textSecondary }}>No data available</Text>
          )}
        </Card>

        <Card style={styles.chartCard}>
          <Text variant="titleMedium" style={{ marginBottom: 12, color: appColors.text }}>Site Ranking by Inspection Count</Text>
          {sitePieData.length > 0 ? (
            <PieChart
              data={sitePieData.map(item => ({ ...item, legendFontColor: appColors.text }))}
              width={Dimensions.get('window').width - 64}
              height={220}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              chartConfig={{
                color: (opacity = 1) => appColors.text,
              }}
              absolute
            />
          ) : (
            <Text style={{ color: appColors.textSecondary }}>No site data available</Text>
          )}
        </Card>

        {/* Heatmap Section (Site Locator)*/}
        <Card style={styles.card}>
          <Text variant="titleMedium" style={styles.cardTitle}>Site Locator</Text>
  
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Enter site description..."
              value={keyword}
              onChangeText={setKeyword}
              style={styles.input}
              placeholderTextColor={appColors.textSecondary}
            />
            <Button mode="contained" onPress={handleSearch} disabled={loading || !keyword } buttonColor="#2E7D32">
              Search
            </Button>
          </View>
  
          {loading ? (
            <ActivityIndicator style={{ marginTop: 50 }} />
          ) : (
            <MapView style={styles.map} region={region}>
              {points.length > 0 && (
                <Heatmap points={points} radius={40} opacity={0.7} />
              )}
  
              {showNames && points.map((point, index) => (
                <Marker
                  key={index}
                  coordinate={{ latitude: point.latitude, longitude: point.longitude }}
                  title={point.namesite || "Unknown"}
                />
              ))}
            </MapView>
          )}
  
          <View style={styles.toggleContainer}>
            <Button mode="outlined" onPress={() => setShowNames(!showNames)} textColor='#2E7D32'>
              {showNames ? "Hide Markers" : "Show Markers"}
            </Button>
          </View>
        </Card>

        <Button
          mode="contained"
          onPress={syncNow}
          loading={loading}
          disabled={loading}
          icon="refresh"
          style={{ marginTop: 20, backgroundColor: appColors.primary }}
          textColor={appColors.white}
        >
          Sync Now
        </Button>
      </ScrollView>

      <SettingsModal
        visible={settingsModalVisible}
        onDismiss={() => setSettingsModalVisible(false)}
        onSave={handleSettingsSaved}
      />

      <Snackbar visible={!!toast} onDismiss={() => setToast('')} duration={2000}>
        {toast}
      </Snackbar>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator animating size="large" color={appColors.primary} />
        </View>
      )}
    </View>
  );
}

const getAnalyticsStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  kpiCard: {
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  kpiValue: {
    marginTop: 4,
    color: colors.primary,
  },
  chartCard: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.modalOverlay,
  },
  card: { 
    marginTop: 16,
    padding: 16 
  },
  cardTitle: { 
    marginBottom: 12 
  },
  searchContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    backgroundColor: colors.background,
    color: colors.text,
  },
  toggleContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  map: {
    height: 400,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
  },
});
