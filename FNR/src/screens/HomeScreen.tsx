import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity, Text as RNText, Platform, RefreshControl, Modal } from 'react-native';
import { ActivityIndicator, Card, Searchbar, Menu, Button, Badge, Checkbox, FAB, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getSites, Site, SiteSummary, getSitesOnline, getDownloadedSites, DownloadedSite, downloadSiteBundle, manualDeleteSites } from '../services/database';
import { RootStackParamList } from '../../App';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { SearchBar } from 'react-native-screens';
import CardContent from 'react-native-paper/lib/typescript/components/Card/CardContent';
import { getHomeScreenStyles } from './styles/HomeScreen.styles';
import SiteListItem from '../components/SiteListItem';
import { AppColors } from '../theme/colors';


// navigation prop type
type NavProp = NativeStackNavigationProp<RootStackParamList, 'Detail'>;
type UnifiedSite = SiteSummary | DownloadedSite;

// milliseconds per day
const MSEC_PER_DAY = 24 * 60 * 60 * 1000;

// determine days since last inspection
export function daysSince(date: string): number {
    return Math.floor((Date.now() - new Date(date).getTime()) / MSEC_PER_DAY);
}

// determine days/months/years since last inspection
export function formateAgeBadge(days: number): string {
    if (!days) return 'N/A';
    if (days < 0) return '0d';
    if (days < 30) return `${days} D`;
    if (days < 365) return `${Math.floor(days / 30)} M`;
    return `${Math.floor(days / 365)} Y`;
}

// determine badge color based on number of days since last inspection date
export function badgeColor(days: number): string {
    if (days <= 180) return '#4CAF50';
    if (days <= 365) return '#FF9800';
    return '#F44336';
}

// home screen component
export default function HomeScreen() {
    // state and navigation
    const nav = useNavigation<NavProp>();
    const theme = useTheme();
    const appColors = theme.colors as unknown as AppColors;
    const styles = useMemo(() => getHomeScreenStyles(appColors), [appColors]);

    const [sites, setSites] = useState<UnifiedSite[]>([]);
    const [sitesSB, setSitesSB] = useState<(SiteSummary | DownloadedSite)[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<{
        field: 'name' | 'date';
        direction: 'asc' | 'desc'
    }>({ field: 'name', direction: 'asc' });
    const [menuVisible, setMenuVisible] = useState(false);
    const [isOnline, setIsOnline] = useState<boolean | null>(null); // is user online
    const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set());
    const [downloadedSiteNames, setDownloadedSiteNames] = useState<Set<string>>(new Set());
    const [refresh, setRefresh] = useState(false);

    // check network status
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected);
        });
        return () => unsubscribe();
    }, []);

    const onRefresh = async () => {
        setRefresh(true);
        await loadSites();
        setRefresh(false);
    };
    
    // load sites based on network status
    const loadSites = async () => {
        setLoading(true);
        try {
            if (isOnline) {
                // get online sites + downloaded site names for icons
                const [onlineSites, downloaded] = await Promise.all([
                    getSitesOnline(), // pull from supabase 
                    getDownloadedSites() // pull from local DB 
                ]);
                setSites(onlineSites);
                setDownloadedSiteNames(new Set(downloaded.map(s => s.namesite)));
            } else {
                // get downloads (offline)
                const downloaded = await getDownloadedSites();
                setSites(downloaded);
                setDownloadedSiteNames(new Set(downloaded.map(s => s.namesite)));
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error loading sites';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOnline !== null) {
            loadSites();
        }
    }, [isOnline]);
    
    
    // sites are filtered (search) and sorted (name or inspection date)
    const filtered = useMemo(() => {
        const lower = search.toLowerCase(); // searched text
        const filteredList = sites.filter(s =>
            s.namesite.toLowerCase().includes(lower) || (s.county && s.county.toLowerCase().includes(lower))); //search for text in site name or site location
            
            // sort logic
            return [...filteredList].sort((a, b) => {
                let comparison = 0;

                if (sortBy.field === 'name') {
                    comparison = a.namesite.localeCompare(b.namesite); // compare and sort
                } else {
                    const da = a.inspectdate ?? '1900-01-01';
                    const db = b.inspectdate ?? '1900-01-01';
                    comparison = new Date(da).getTime() - new Date(db).getTime(); 
                }

                return sortBy.direction === 'asc' ? comparison : -comparison;
            });
    }, [sites, search, sortBy]);

    // show if app is online or offline
    const getConnectionStatus = (isOnline: boolean | null) => {
        if (isOnline === null) return { text: 'Checking network...', color: '#9E9E9E' };
        return isOnline
            ? { text: 'Online', color: '#4CAF50' }
            : { text: 'Offline', color: '#F44336' };
    };
    
    // select or deselect sites for download
   
    const toggleSiteSelection = useCallback((siteName: string) => {
        setSelectedSites(prev => {
            const newSet = new Set(prev);
            if (newSet.has(siteName)) {
                newSet.delete(siteName);
            } else {
                newSet.add(siteName);
            }
            return newSet;
        });
    }, []);

    // download selected sites for offline use
    const downloadSelectedSites = async () => {
        // no sites selected
        if (selectedSites.size === 0) return;
        // download each selected site
        try {
            // const { downloadSiteBundle } = await import('../services/database');
            await Promise.all(Array.from(selectedSites).map(siteName => downloadSiteBundle(siteName)));
            alert(`Downloaded ${selectedSites.size} sites`);
            setSelectedSites(new Set());

            // refresh downloaded sites list
            const newDownloaded = await getDownloadedSites();
            setDownloadedSiteNames(new Set(newDownloaded.map(s => s.namesite)));
        } catch (err) {
            alert('Download failed: ' + (err as Error).message);
        }
    };

    // delete selected sites from local db (manual delete)
    const deleteSelectedSites = async () => {
        // no sites selected
        if (selectedSites.size === 0) return;
        // delete each selected site
        try {
            await manualDeleteSites(Array.from(selectedSites));
            alert(`Deleted ${selectedSites.size} site(s)`);
            setSelectedSites(new Set());

            // refresh downloaded sites list
            const newDownloaded = await getDownloadedSites();
            setDownloadedSiteNames(new Set(newDownloaded.map(s => s.namesite)));
            setSites(newDownloaded);
        } catch (err) {
            alert('Deletion failed: ' + (err as Error).message);
        }
    };

    const handleSortSelect = (field: 'name' | 'date', direction: 'asc' | 'desc') => {
        setSortBy({ field, direction });
        setMenuVisible(false);
    };

    // memoized renderItem for FlatList
        const renderItem = useCallback(({ item }: { item: UnifiedSite }) => {
        const isSelected = selectedSites.has(item.namesite);
        const isDownloaded = downloadedSiteNames.has(item.namesite);

        return (
            <SiteListItem
                item={item}
                isSelected={isSelected}
                isDownloaded={isDownloaded}
                onPress={() => nav.navigate('Detail', { site: item })}
                onToggleSelect={toggleSiteSelection}
                styles={styles}
                appColors={appColors}
            />
        );
    }, [nav, toggleSiteSelection, selectedSites, downloadedSiteNames, styles, appColors]);

    // error state
    if (error) {
        return (
            <View style={styles.center}>
                <RNText style={{ color: 'red' }}> {error} </RNText>
            </View>
        );
    }

    // loading state
    if (loading || isOnline === null) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <RNText>{isOnline === null ? 'Checking network...' : 'Loading sites...'}</RNText>
            </View>
        );
    }

    // data loaded state (UI)
    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Searchbar 
                    testID="search-input"
                    placeholder='Search site name'
                    value={search} 
                    onChangeText={setSearch} 
                    style={styles.searchBar}
                    inputStyle={styles.searchInput} 
                />
                
                <View style={styles.controlsRow}>
                    {/* Online/Offline badge */}
                    <View style={[styles.statusBadge, {backgroundColor: getConnectionStatus(isOnline).color + '20' }]}>
                        <MaterialCommunityIcons
                            name={isOnline ? 'wifi' : 'wifi-off'}
                            size={14}
                            color={getConnectionStatus(isOnline).color}
                            style={styles.wifiIcon}
                        />
                        <RNText style={[styles.statusText, { color: getConnectionStatus(isOnline).color }]}>
                            {getConnectionStatus(isOnline).text}
                        </RNText>
                    </View>

                    {/* Sort button */}
                    <TouchableOpacity 
                        onPress={() => setMenuVisible(true)} 
                        style={styles.sortBtn}
                    >
                        <View style={styles.sortBtnContent}>
                            <MaterialCommunityIcons
                                name='sort'
                                size={16}
                                color='black'
                                style={styles.sortIcon}
                            />
                            <RNText style={styles.sortLabel}>
                                Sort: {sortBy.field === 'name'
                                ? (sortBy.direction === 'asc' ? 'Name (A-Z)' : 'Name (Z-A)')
                                : (sortBy.direction === 'desc' ? 'Inspection (Newest)' : 'Inspection (Oldest)')}
                            </RNText>
                        </View>
                    </TouchableOpacity>

                    {/* Sort options */}
                    <Modal
                        visible={menuVisible}
                        transparent={true}
                        animationType="none"
                        onRequestClose={() => setMenuVisible(false)}
                    >
                        <TouchableOpacity 
                            style={styles.modalOverlay}
                            activeOpacity={1}
                            onPress={() => setMenuVisible(false)}
                        >
                            <View style={styles.modalContainer}>
                                <TouchableOpacity
                                    style={styles.modalItem}
                                    onPress={() => handleSortSelect('name', 'asc')}
                                >
                                    <MaterialCommunityIcons
                                        name='sort-alphabetical-ascending'
                                        size={20}
                                        color='black'
                                        style={styles.modalSortIcon}
                                    />
                                    <RNText style={styles.modalItemText}>Name (A-Z)</RNText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalItem}
                                    onPress={() => handleSortSelect('name', 'desc')}
                                >
                                    <MaterialCommunityIcons
                                        name='sort-alphabetical-descending'
                                        size={20}
                                        color='black'
                                        style={styles.modalSortIcon}
                                    />
                                    <RNText style={styles.modalItemText}>Name (Z-A)</RNText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalItem}
                                    onPress={() => handleSortSelect('date', 'desc')}
                                >
                                    <MaterialCommunityIcons
                                        name='sort-calendar-descending'
                                        size={20}
                                        color='black'
                                        style={styles.modalSortIcon}
                                    />
                                    <RNText style={styles.modalItemText}>Inspection (Newest)</RNText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalItemLast}
                                    onPress={() => handleSortSelect('date', 'asc')}
                                >
                                    <MaterialCommunityIcons
                                        name='sort-calendar-ascending'
                                        size={20}
                                        color='black'
                                        style={styles.modalSortIcon}
                                    />
                                    <RNText style={styles.modalItemText}>Inspection (Oldest)</RNText>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </Modal>
                </View>
            </View>


            <FlatList
                data={filtered} // use precomputed data
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refresh} onRefresh={onRefresh} />
                }
                // performance props
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={21}
                removeClippedSubviews={Platform.OS === 'android'}
            />

            {/* floating button (online) */}
            {isOnline && (
                <FAB
                    icon='download'
                    label='Download'
                    style={styles.fab}
                    color='#FFFFFF'
                    onPress={downloadSelectedSites}
                    disabled={selectedSites.size === 0}
                />
            )}

            {/* floating button (offline) */}
            {!isOnline && (
                <FAB
                    icon='delete'
                    label='Delete'
                    style={styles.fab}
                    color='#FFFFFF'
                    onPress={deleteSelectedSites}
                    disabled={selectedSites.size === 0}
                />
            )}
        </View>
    );
}