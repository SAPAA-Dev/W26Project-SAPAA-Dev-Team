import React, { useEffect, useState, useMemo } from 'react';
import { FlatList, View, TouchableOpacity, Text as RNText, RefreshControl, Modal,} from 'react-native';
import { ActivityIndicator, Searchbar, Badge, Checkbox, FAB, useTheme, Button, } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getSitesOnline, getDownloadedSites, DownloadedSite, SiteSummary, } from '../services/database';
import { RootStackParamList } from '../../App';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getHomeScreenStyles } from './styles/HomeScreen.styles';
import { AppColors } from '../theme/colors';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Detail'>;
type UnifiedSite = SiteSummary | DownloadedSite;

// time helper constants
const MSEC_PER_DAY = 24 * 60 * 60 * 1000;

function daysSince(date: string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / MSEC_PER_DAY);
}

function formateAgeBadge(days: number): string {
  if (!days) return 'N/A';
  if (days < 0) return '0d';
  if (days < 30) return `${days} D`;
  if (days < 365) return `${Math.floor(days / 30)} M`;
  return `${Math.floor(days / 365)} Y`;
}

function badgeColor(days: number): string {
  if (days <= 180) return '#4CAF50';
  if (days <= 365) return '#FF9800';
  return '#F44336';
}

export default function AdminSitesScreen() {
  const nav = useNavigation<NavProp>();
  const theme = useTheme();
  const styles = useMemo(() => getHomeScreenStyles(theme.colors as unknown as AppColors), [theme]);

  const [sites, setSites] = useState<UnifiedSite[]>([]);
  const [downloadedSiteNames, setDownloadedSiteNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<{
    field: 'name' | 'date';
    direction: 'asc' | 'desc';
  }>({ field: 'name', direction: 'asc' });
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [refresh, setRefresh] = useState(false);

  const loadSites = async () => {
    setLoading(true);
    try {
      // Admin version → only online
      const onlineSites = await getSitesOnline();
      const downloaded = await getDownloadedSites(); // just for icons
      setSites(onlineSites);
      setDownloadedSiteNames(downloaded.map((s) => s.namesite));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading sites';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  const onRefresh = async () => {
    setRefresh(true);
    await loadSites();
    setRefresh(false);
  };

  // Search + Sort logic
  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    const filteredList = sites.filter(
      (s) =>
        s.namesite.toLowerCase().includes(lower) ||
        (s.county && s.county.toLowerCase().includes(lower))
    );

    return [...filteredList].sort((a, b) => {
      let comparison = 0;
      if (sortBy.field === 'name') {
        comparison = a.namesite.localeCompare(b.namesite);
      } else {
        const da = a.inspectdate ?? '1900-01-01';
        const db = b.inspectdate ?? '1900-01-01';
        comparison = new Date(da).getTime() - new Date(db).getTime();
      }
      return sortBy.direction === 'asc' ? comparison : -comparison;
    });
  }, [sites, search, sortBy]);

  const handleSortSelect = (field: 'name' | 'date', direction: 'asc' | 'desc') => {
    setSortBy({ field, direction });
    setMenuVisible(false);
  };

  if (error) {
    return (
      <View style={styles.center}>
        <RNText style={{ color: 'red' }}> {error} </RNText>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <RNText>Loading sites...</RNText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        {/*  Search Bar */}
        <Searchbar
          testID="search-input"
          placeholder="Search site name"
          value={search}
          onChangeText={setSearch}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />

        <View style={{flexDirection: 'row',  justifyContent: 'flex-end', alignItems: 'center' }}>
          {/* Sort button */}
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            style={[styles.sortBtn, { marginTop: 8 }]} 
          >
            <View style={styles.sortBtnContent}>
              <MaterialCommunityIcons
                name="sort"
                size={16}
                color={theme.colors.onSurface}
                style={styles.sortIcon}
              />
              <RNText style={styles.sortLabel}>
                Sort:{' '}
                {sortBy.field === 'name'
                  ? sortBy.direction === 'asc'
                    ? 'Name (A-Z)'
                    : 'Name (Z-A)'
                  : sortBy.direction === 'desc'
                    ? 'Inspection (Newest)'
                    : 'Inspection (Oldest)'}
              </RNText>
            </View>
          </TouchableOpacity>

          {/* Sort modal */}
          <Modal
            visible={menuVisible}
            transparent
            animationType="none"
            onRequestClose={() => setMenuVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setMenuVisible(false)}
            >
              <View style={styles.modalContainer}>
                {[
                  ['sort-alphabetical-ascending', 'Name (A-Z)', 'name', 'asc'],
                  ['sort-alphabetical-descending', 'Name (Z-A)', 'name', 'desc'],
                  ['sort-calendar-descending', 'Inspection (Newest)', 'date', 'desc'],
                  ['sort-calendar-ascending', 'Inspection (Oldest)', 'date', 'asc'],
                ].map(([icon, label, field, dir], i, arr) => (
                  <TouchableOpacity
                    key={label}
                    style={
                      i === arr.length - 1
                        ? styles.modalItemLast
                        : styles.modalItem
                    }
                    onPress={() =>
                      handleSortSelect(field as 'name' | 'date', dir as 'asc' | 'desc')
                    }
                  >
                    <MaterialCommunityIcons
                      name={icon as any}
                      size={20}
                      color={theme.colors.onSurface}
                      style={styles.modalSortIcon}
                    />
                    <RNText style={styles.modalItemText}>{label}</RNText>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </View>

      {/* Site List */}
      <FlatList
        testID="flatlist"
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const age = daysSince(item.inspectdate ?? '1900-01-01');
          const ageText = formateAgeBadge(age);
          const isSelected = selectedSites.includes(item.namesite);
          const isDownloaded = downloadedSiteNames.includes(item.namesite);

          return (
            <TouchableOpacity
              onPress={() => nav.navigate('AdminSiteDetail', { site: item })}
              style={styles.card}
            >
              <View style={styles.cardContent}>
                {/* Checkbox */}
                <View style={styles.checkboxContainer}>
                  <Checkbox
                    status={isSelected ? 'checked' : 'unchecked'}
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      setSelectedSites((prev) =>
                        prev.includes(item.namesite)
                          ? prev.filter((x) => x !== item.namesite)
                          : [...prev, item.namesite]
                      );
                    }}
                  />
                </View>

                {/* Text Info */}
                <View style={styles.textContainer}>
                  <RNText style={styles.siteName} numberOfLines={2}>
                    {item.namesite}
                  </RNText>

                  {item.county ? (
                    <View style={styles.countyContainer}>
                      <MaterialCommunityIcons
                        name="map-marker-outline"
                        size={14}
                        color="#6B7280"
                        style={styles.countyIcon}
                      />
                      <RNText style={styles.county}>{item.county}</RNText>
                    </View>
                  ) : null}

                  <View style={styles.lastInspection}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={14}
                      color="#9CA3AF"
                      style={styles.lastInspectionIcon}
                    />
                    <RNText style={styles.lastInspection}>
                      Last Inspection:{' '}
                      {item.inspectdate
                        ? new Date(item.inspectdate).toLocaleDateString()
                        : 'N/A'}
                    </RNText>
                  </View>
                </View>

                {/* Badges */}
                <View style={styles.badgesContainer}>
                  {isDownloaded ? (
                    <MaterialCommunityIcons
                      name="download-circle"
                      size={20}
                      color="#4CAF50"
                      style={styles.downloadedIcon}
                    />
                  ) : null}
                  <Badge
                    style={[styles.badge, { backgroundColor: badgeColor(age) }]}
                    size={28}
                  >
                    {ageText}
                  </Badge>
                </View>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#9CA3AF"
                style={styles.chevron}
              />
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refresh} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}
