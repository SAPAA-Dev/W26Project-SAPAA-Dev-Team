import { StyleSheet, Platform } from 'react-native';
import { AppColors, LightColors, DarkColors } from '../../theme/colors';

export const getAdminSiteDetailScreenStyles = (colors: AppColors) => StyleSheet.create({
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
        padding: 20,
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

    // Info Card
    infoCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginLeft: 8,
        flex: 1,
    },
    countBadge: {
        backgroundColor: colors.primary,
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
    
    // Expandable Cards
    expandableCard: {
        marginBottom: 8,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    expandableHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: colors.background,
    },
    expandableTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: colors.text,
        marginLeft: 12,
    },
    expandableContent: {
        padding: 16,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    observationItem: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    observationQuestion: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 4,
    },
    observationAnswer: {
        fontSize: 14,
        color: colors.text,
        lineHeight: 20,
    },

    // Images Section
    imagesList: {
        paddingVertical: 8,
    },
    imageCard: {
        marginRight: 12,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: colors.background,
    },
    img: {
        width: 200,
        height: 200,
    },

    // PDFs Section
    pdfItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: colors.background,
        borderRadius: 8,
        marginBottom: 8,
    },
    pdfIcon: {
        marginRight: 12,
    },
    pdfText: {
        flex: 1,
        fontSize: 15,
        color: colors.text,
    },

    //  Modal Styles
    modalContainer: {
        backgroundColor: colors.background,
        marginHorizontal: 16,
        borderRadius: 12,
        maxHeight: '88%',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
        padding: 12,
        marginTop: 8
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.background,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        flex: 1,
        fontSize: 19,
        fontWeight: '700',
        color: colors.text,
        flexWrap: 'wrap',
        marginRight: 12,
    },
    modalHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    modalActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionButton: {
        minWidth: 80,
    },
    actionButtonLabel: {
        fontSize: 13,
        fontWeight: '600',
        textAlignVertical: 'center',
    },
    deleteButton: {
        padding: 0,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    markdownContainer: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: colors.background,
        marginTop: 12, 
    },

    // Edit Mode Title
    editModeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: colors.text,
    },

    // Edit Input Style - FIXED FOR DARK MODE
    editInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        backgroundColor: colors.surface,
        color: colors.text,
    },
    editFieldContainer: {
        marginBottom: 20,
        padding: 16,
        backgroundColor: colors.background,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    editFieldLabel: {
        fontWeight: 'bold',
        fontSize: 14,
        color: colors.text,
        marginBottom: 8,
    },
    
    // Observation Edit Styles 
    observationEditItem: {
        marginBottom: 16,
        padding: 16,
        backgroundColor: colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    observationEditLabel: {
        fontWeight: '600',
        fontSize: 14,
        color: colors.text,
        marginBottom: 8,
    },
    observationEditInput: {
        minHeight: 60,
        backgroundColor: colors.surfaceVariant,
        color: colors.text,
    },

    // Observations Section Header
    observationsSectionLabel: {
        fontWeight: 'bold',
        marginBottom: 8,
        color: colors.text,
        fontSize: 16,
    },

    // Plain text observation (non-editable)
    plainObservationText: {
        color: colors.textSecondary,
        fontSize: 14,
    },

    // Saving Overlay
    savingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.background,
        opacity: 0.9,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    savingText: {
        color: colors.primary,
        marginTop: 10,
        fontSize: 16,
    },

    // buttons 
    detailButtons: {
        fontSize: 10, 
        borderRadius: 1, 
    }, 
});

export const getMarkdownStyles = (colors: AppColors) => ({
    body: {
        fontSize: 15,
        lineHeight: 24,
        color: colors.text,
    },
    heading1: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginTop: 0,
        marginBottom: 16,
    },
    heading2: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text,
        marginTop: 20,
        marginBottom: 12,
    },
    paragraph: {
        marginBottom: 12,
        lineHeight: 22,
        color: colors.text,
    },
    strong: {
        fontWeight: '600',
        color: colors.text,
    },
    bullet_list: {
        marginBottom: 12,
    },
    ordered_list: {
        marginBottom: 12,
    },
    list_item: {
        marginBottom: 8,
        lineHeight: 22,
        color: colors.text,
    },
    code_inline: {
        backgroundColor: colors.background,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 14,
        fontFamily: 'monospace',
        color: colors.text,
    },
    code_block: {
        backgroundColor: colors.background,
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        fontSize: 14,
        fontFamily: 'monospace',
        color: colors.text,
    },
});

// Backward compatibility
export const styles = getAdminSiteDetailScreenStyles(LightColors);
export const markdownStyles = getMarkdownStyles(LightColors);