import { StyleSheet, Platform } from 'react-native';
import { AppColors, LightColors } from '../../theme/colors';

export const getSiteDetailScreenStyles = (colors: AppColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    contentContainer: {
        padding: 12,
        paddingBottom: 24,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: colors.textSecondary,
    },
    errorText: {
        marginTop: 12,
        fontSize: 17,
        color: colors.error,
        textAlign: 'center',
    },

    // Header Card
    headerCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 18,
        marginBottom: 12,
        ...Platform.select({
            android: { elevation: 1 },
            ios: { 
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            }
        }),
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerTextContainer: {
        flex: 1,
        marginRight: 12,
    },
    siteName: {
        fontSize: 26,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    countyText: {
        fontSize: 17,
        color: colors.textSecondary,
        marginLeft: 4,
    },
    inspectionDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    inspectionDateText: {
        fontSize: 16,
        color: colors.textTertiary,
        marginLeft: 4,
        fontWeight: '500',
    },
    ageBadge: {
        backgroundColor: colors.surfaceVariant || '#E5E7EB',
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 8,
        minWidth: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ageBadgeText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },

    // Reports Count Card
    reportsCountCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        ...Platform.select({
            android: { elevation: 1 },
            ios: { 
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            }
        }),
    },
    reportsCountLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginRight: 8,
    },
    reportsCountValue: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.primary,
    },

    // Gradient Slider Card
    gradientCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 18,
        marginBottom: 12,
        ...Platform.select({
            android: { elevation: 1 },
            ios: { 
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            }
        }),
    },
    gradientHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    gradientTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    gradientScore: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.primary,
    },
    gradientContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    gradientBar: {
        flexDirection: 'row',
        height: 32,
        borderRadius: 16,
        overflow: 'hidden',
    },
    gradientSegment: {
        height: '100%',
    },
    indicator: {
        position: 'absolute',
        top: -8,
        transform: [{ translateX: -8 }],
        alignItems: 'center',
    },
    indicatorTriangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: colors.text,
    },
    indicatorLine: {
        width: 3,
        height: 48,
        backgroundColor: colors.text,
    },
    gradientLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingHorizontal: 4,
    },
    gradientLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    conditionText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        textAlign: 'center',
        marginTop: 12,
    },

    // Expandable Cards
    expandableCard: {
        backgroundColor: colors.background,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    expandableHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: colors.surface,
    },
    expandableTitle: {
        fontSize: 15,
        color: colors.primary,
        marginLeft: 8,
        flex: 1,
        fontWeight: '500',
    },
    expandableContent: {
        padding: 12,
        paddingTop: 8,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    inspectionDetail: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    inspectionDetailLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textSecondary,
        width: 90,
    },
    inspectionDetailValue: {
        fontSize: 15,
        color: colors.text,
        flex: 1,
    },
    inspectionNotesContainer: {
        marginTop: 4,
    },
    inspectionNotes: {
        fontSize: 15,
        color: colors.textTertiary,
        lineHeight: 20,
        marginTop: 4,
    },
    noNotes: {
        fontSize: 15,
        color: colors.textSecondary,
        fontStyle: 'italic',
    },

    // Info Cards
    infoCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 18,
        marginBottom: 12,
        ...Platform.select({
            android: { elevation: 1 },
            ios: { 
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            }
        }),
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: '600',
        color: colors.text,
        marginLeft: 8,
        flex: 1,
    },
    countBadge: {
        backgroundColor: colors.surfaceVariant || '#E5E7EB',
        color: colors.text,
    },

    // Details Grid
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    detailItem: {
        width: '50%',
        paddingHorizontal: 6,
        marginBottom: 18,
    },
    detailLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 6,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '600',
    },
    detailsNote: {
        backgroundColor: colors.background,
        borderRadius: 8,
        padding: 14,
        marginTop: 4,
    },
    detailsNoteLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
        marginBottom: 6,
    },
    detailsNoteText: {
        fontSize: 15,
        color: colors.textTertiary,
        lineHeight: 22,
    },

    // Images
    imagesList: {
        paddingVertical: 4,
    },
    imageCard: {
        marginRight: 12,
        borderRadius: 8,
        overflow: 'hidden',
        ...Platform.select({
            android: { elevation: 2 },
            ios: { 
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            }
        }),
    },
    img: {
        width: 160,
        height: 160,
        borderRadius: 8,
    },

    // PDFs
    pdfItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: colors.background,
        borderRadius: 8,
        marginBottom: 8,
    },
    pdfIcon: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#FEF2F2', // Keep as is or make dynamic if needed, but red bg for PDF icon seems standard
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    pdfText: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
    },

    modalContainer: {
        backgroundColor: colors.surface, // use surface for contrast in dark mode
        margin: 16,
        borderRadius: 12,
        maxHeight: '90%',
        padding: 12, // add padding to prevent text overflow
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, },
    modalTitle: { fontSize: 18, fontWeight: '600', color: colors.text, },
    markdownContainer: { padding: 16, },
    reportContainer: {backgroundColor: colors.background, borderRadius: 8, padding: 14, marginTop: 12, fontFamily: 'monospace', },
    reportText: { fontSize: 14, color: colors.textTertiary, lineHeight: 20, },
    reportRow: {flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border,},
    reportTitle: {fontSize: 15, color: colors.text, marginLeft: 8, flex: 1, fontWeight: '500',}, 

    // Tab styles
    tabContainer: {
        flexDirection: 'row',
        marginVertical: 12,
        backgroundColor: colors.surfaceVariant || '#F3F4F6',
        borderRadius: 8,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        gap: 6,
    },
    activeTab: {
        backgroundColor: colors.surface,
        ...Platform.select({
            android: { elevation: 1 },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            }
        }),
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    activeTabText: {
        color: colors.primary,
        fontWeight: '600',
    },

    // Question comparison styles
    questionCard: {
        backgroundColor: colors.surface,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: colors.background,
    },
    questionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    questionId: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    answersContainer: {
        padding: 12,
        paddingTop: 8,
        backgroundColor: colors.surface,
    },
    answerItem: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    answerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    answerDate: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    answerText: {
        fontSize: 14,
        color: colors.textTertiary,
        lineHeight: 20,
    },
      pdfButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pdfButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});

export const getMarkdownStyles = (colors: AppColors) => ({
    body: { fontSize: 16, color: colors.text, lineHeight: 24 },
    heading1: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: colors.text },
    heading2: { fontSize: 20, fontWeight: '600', marginTop: 24, marginBottom: 12, color: colors.text },
    strong: { fontWeight: '600', color: colors.text },
    link: { color: colors.primary },
    paragraph: { marginBottom: 12, color: colors.text }
});

// Backward compatibility
export const styles = getSiteDetailScreenStyles(LightColors);
export const markdownStyles = getMarkdownStyles(LightColors);
