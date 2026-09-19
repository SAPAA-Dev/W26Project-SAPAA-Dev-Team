import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, ScrollView, TextInput, ActivityIndicator, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Heatmap, Marker } from 'react-native-maps';
import { PieChart } from 'react-native-chart-kit';
import { supabase } from '../services/supabase';
import { getCoordinatesFromName } from '../services/openCage';
import { useTheme, Card, Text, Button } from 'react-native-paper';
import { AppColors } from '../theme/colors';

type Stats = {
  totalInspections: number;
  lastInspectionDate: Date | null;
};


export default function DashboardScreen() {
  // --- KPI Tile ---
  const KPI = ({ label, value }: { label: string; value: string | number }) => (
    <Card style={styles.kpiCard}>
      <Card.Content>
        <Text variant="labelLarge">{label}</Text>
        <Text variant="displaySmall" style={styles.kpiValue}>{value}</Text>
      </Card.Content>
    </Card>
  );

  const theme = useTheme();
  const appColors = theme.colors as unknown as AppColors;
  const styles = useMemo(() => getDashboardStyles(appColors), [appColors]);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalInspections: 0,
    lastInspectionDate: null,
  });
  const [naturalnessPieData, setNaturalnessPieData] = useState<any[]>([]);
  const [sitePieData, setSitePieData] = useState<any[]>([]);
  const [points, setPoints] = useState<any[]>([]);
  const [keyword, setKeyword] = useState('');
  const [showNames, setShowNames] = useState(false);
  const [region, setRegion] = useState({
    latitude: 53.5461,
    longitude: -113.4938,
    latitudeDelta: 5,
    longitudeDelta: 5,
  });

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

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

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

      const { data: naturalnessData, error: rpcError } = await supabase.rpc(
        'get_naturalness_distribution'
      );
      if (rpcError) throw rpcError;

      const { data: topSites, error } = await supabase.rpc('get_top_sites_distribution');

      if (error) console.error(error);

      const lastRow = lastRows?.[0] || null;

      setStats({
        totalInspections: detailCount || 0,
        lastInspectionDate: lastRow?.inspectdate
          ? new Date(lastRow.inspectdate)
          : null,
      });

      // Define some color palette
      const colors = [
        '#999999', '#4caf50', '#2196f3', '#1976d2', '#81c784',
        '#ff9800', '#f44336', '#ffb74d'
      ];

      // Format pie chart data dynamically from Supabase RPC
      const formattedPieData = (naturalnessData || []).map(
        (item: { naturalness_score: string; count: number }, index: number) => ({
          name: item.naturalness_score || 'Unknown',
          count: item.count,
          color: colors[index % colors.length],
          legendFontColor: appColors.text,
          legendFontSize: 12,
        })
      );
      setNaturalnessPieData(formattedPieData);

      const sitePieData = (topSites || []).map(
        (item: { namesite: string; count: number }, index: number) => ({
          name: item.namesite || 'Other',
          count: item.count,
          color: colors[index % colors.length],
          legendFontColor: appColors.text,
          legendFontSize: 12,
        })
      );
      setSitePieData(sitePieData);


    } catch (error: any) {
      console.error('Error fetching stats:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color={appColors.primary} style={{ marginTop: 100 }} />;

  return (
    <ScrollView
            contentContainerStyle={{ padding: 16 }}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStats} colors={[appColors.primary]} tintColor={appColors.primary} />}
          >

    <Text variant="headlineSmall" style={{ marginBottom: 12, color: appColors.text }}>
              Admin Dashboard
            </Text>

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
              labelColor: (opacity = 1) => appColors.text,
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
              labelColor: (opacity = 1) => appColors.text,
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
    </ScrollView>
  );
}

const getDashboardStyles = (colors: AppColors) => StyleSheet.create({
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
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
  noDataText: {
    color: colors.textSecondary,
  },
  heatmapContainer: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: colors.text,
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
  card: { 
    marginTop: 16,
    padding: 16 
  },
  cardTitle: { 
    marginBottom: 12 
  },
});