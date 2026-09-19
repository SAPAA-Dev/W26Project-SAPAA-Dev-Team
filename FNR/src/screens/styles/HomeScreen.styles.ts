import { StyleSheet, Platform } from 'react-native';
import { AppColors, LightColors } from '../../theme/colors';

export const getHomeScreenStyles = (colors: AppColors) => StyleSheet.create({
    // screen container
    container: { flex: 1, backgroundColor: colors.background },
    // header section
    headerContainer: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, backgroundColor: colors.background },
    searchBar: { backgroundColor: colors.searchBarBg, borderRadius: 12, elevation: 0, shadowOpacity: 0, height: 48, },
    searchInput: { fontSize: 16, color: colors.text },
    controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, },
    // status badge
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 12, }, 
    wifiIcon: { marginRight: 6, },
    statusText: { fontSize: 16, fontWeight: '500', }, 
    // sort button
    sortBtn: {borderRadius: 12, borderWidth: 1, borderColor: colors.border, height: 38, backgroundColor: colors.surface, paddingHorizontal: 12, justifyContent: 'center', },
    sortBtnContent: { flexDirection: 'row', alignItems: 'center', },
    sortIcon: { marginRight: 8, color: colors.text },
    sortLabel: { fontSize: 14, fontWeight: '500', color: colors.text, },
    // sort modal
    modalOverlay: { flex: 1, backgroundColor: colors.modalOverlay, justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 120, paddingRight: 20, },
    modalContainer: { backgroundColor: colors.surface, borderRadius: 8, padding: 4, minWidth: 200, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, },
    modalItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, },
    modalItemLast: { flexDirection: 'row', alignItems: 'center', padding: 12, },
    modalItemText: { fontSize: 16, color: colors.text },
    modalSortIcon: { flexDirection: 'row', paddingRight: 6, color: colors.text },
    // card section
    card: { marginHorizontal: 12, marginVertical: 6, borderRadius: 12, backgroundColor: colors.surface, ...Platform.select({ android: { elevation: 1 }, }) },
    cardContent: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 18, paddingHorizontal: 16, },
    checkboxContainer: { marginTop: 4, marginRight: 12, },
    textContainer: { flex: 1, justifyContent: 'center', marginRight: 8, }, 
    siteName: { fontSize: 16, fontWeight: '600', color: colors.text, paddingBottom: 8, },
    county: { fontSize: 14, color: colors.textSecondary, marginBottom: 6, },
    countyContainer: { flexDirection: 'row', alignItems: 'center', },
    countyIcon: { marginRight: 6, marginBottom: 6, color: colors.icon },
    lastInspection: { fontSize: 12, color: colors.textTertiary, flexDirection: 'row', alignItems: 'center', },
    lastInspectionIcon: { marginRight: 4, color: colors.icon },
    // badges
    badge: { minWidth: 40, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', },
    badgesContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginLeft: 8, },
    downloadedIcon: { marginRight: 8, },

    chevron: { position: 'absolute', right: 12, bottom: 12, color: colors.textTertiary },

    listContent: { paddingBottom: 90, paddingHorizontal: 4, }, // leave room for download button
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: colors.primary },  
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
});

// Backward compatibility for AdminSitesScreen until it is refactored
export const styles = getHomeScreenStyles(LightColors);