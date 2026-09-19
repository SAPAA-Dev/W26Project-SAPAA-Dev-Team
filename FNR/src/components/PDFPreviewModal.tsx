import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Portal, Modal, Checkbox, ActivityIndicator, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SiteSummary, DownloadedSite, InspectionDetail } from '../services/database';
import {
  generateSitePDF,
  sharePDF,
  previewSitePDF,
  PDFFieldConfig,
  DEFAULT_PDF_FIELDS,
  PDF_FIELD_LABELS,
} from '../services/pdfGenerator';
import { AppColors } from '../theme/colors';

interface PDFPreviewModalProps {
  visible: boolean;
  onDismiss: () => void;
  site: SiteSummary | DownloadedSite;
  inspection: InspectionDetail;
  allInspections?: InspectionDetail[];
  onPreview: (uri: string) => void;
}

export default function PDFPreviewModal({
  visible,
  onDismiss,
  site,
  inspection,
  allInspections = [],
  onPreview,
}: PDFPreviewModalProps) {
  const theme = useTheme();
  const appColors = theme.colors as unknown as AppColors;
  const styles = useMemo(() => getPDFPreviewModalStyles(appColors), [appColors]);

  const [fields, setFields] = useState<PDFFieldConfig>(DEFAULT_PDF_FIELDS);
  const [includeHistory, setIncludeHistory] = useState(false);
  const [generating, setGenerating] = useState(false);

  const toggleField = (field: keyof PDFFieldConfig) => {
    setFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const selectAll = () => {
    const allTrue = Object.keys(DEFAULT_PDF_FIELDS).reduce((acc, key) => {
      acc[key as keyof PDFFieldConfig] = true;
      return acc;
    }, {} as PDFFieldConfig);
    setFields(allTrue);
  };

  const deselectAll = () => {
    const allFalse = Object.keys(DEFAULT_PDF_FIELDS).reduce((acc, key) => {
      acc[key as keyof PDFFieldConfig] = false;
      return acc;
    }, {} as PDFFieldConfig);
    setFields(allFalse);
  };

  const handleGenerate = async (action: 'preview' | 'download') => {
    const hasSelection = Object.values(fields).some(v => v);
    if (!hasSelection) {
      Alert.alert('No Fields Selected', 'Please select at least one field to include in the PDF.');
      return;
    }

    setGenerating(true);
    try {
      if (action === 'preview') {
        const uri = await previewSitePDF({
          site,
          inspection,
          fields,
          includeAllInspections: includeHistory,
          allInspections: includeHistory ? allInspections : [],
        });

        onDismiss();
        onPreview(uri);
      } else {
        const uri = await generateSitePDF({
          site,
          inspection,
          fields,
          includeAllInspections: includeHistory,
          allInspections: includeHistory ? allInspections : [],
        });

        await sharePDF(uri, site.namesite || 'site');
        Alert.alert('Success', 'PDF is ready to share!');
      }
    } catch (error: any) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', error?.message || 'Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  const selectedCount = Object.values(fields).filter(v => v).length;
  const totalFields = Object.keys(fields).length;

  const allSelected = selectedCount === totalFields;
  const noneSelected = selectedCount === 0;

  const selectAllBtnStyle = allSelected ? styles.bulkButtonPrimary : styles.bulkButton;
  const selectAllTextStyle = allSelected ? styles.bulkButtonPrimaryText : styles.bulkButtonText;

  const clearAllBtnStyle = noneSelected ? styles.bulkButtonPrimary : styles.bulkButton;
  const clearAllTextStyle = noneSelected ? styles.bulkButtonPrimaryText : styles.bulkButtonText;
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.title}>Generate PDF Report</Text>
            <Text style={styles.subtitle}>
              Choose the fields to include in your report
            </Text>
          </View>
          <TouchableOpacity testID="pdf-modal-close" onPress={onDismiss} style={styles.closeButton} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={22} color={appColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Selection Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <MaterialCommunityIcons name="checkbox-marked-circle" size={20} color={appColors.primary} />
              <Text style={styles.summaryText}>
                {selectedCount} of {totalFields} fields selected
              </Text>
            </View>

            <View style={styles.bulkActions}>
              <TouchableOpacity
                onPress={selectAll}
                style={selectAllBtnStyle}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="select-all" size={16} color={allSelected ? appColors.primary : appColors.textSecondary} />
                <Text style={selectAllTextStyle}>Select All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={deselectAll}
                style={clearAllBtnStyle}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="close-circle-outline" size={16} color={noneSelected ? appColors.primary : appColors.textSecondary} />
                <Text style={clearAllTextStyle}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fields */}
          <Text style={styles.sectionTitle}>Report Fields</Text>
          <View style={styles.fieldsList}>
            {(Object.keys(fields) as Array<keyof PDFFieldConfig>).map((field, index) => {
              const isLast = index === Object.keys(fields).length - 1;
              return (
                <TouchableOpacity
                  key={field}
                  style={[styles.fieldRow, isLast && styles.fieldRowLast]}
                  onPress={() => toggleField(field)}
                  activeOpacity={0.7}
                >
                  <View style={styles.fieldContent}>
                    <Checkbox.Android
                      status={fields[field] ? 'checked' : 'unchecked'}
                      onPress={() => toggleField(field)}
                      color={appColors.primary}
                      uncheckedColor={appColors.textTertiary}
                    />
                    <Text style={styles.fieldLabel}>{PDF_FIELD_LABELS[field]}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* History */}
          {allInspections.length > 1 && (
            <>
              <Text style={styles.sectionTitle}>Additional Options</Text>
              <View style={styles.historyCard}>
                <TouchableOpacity
                  style={styles.historyRow}
                  onPress={() => setIncludeHistory(!includeHistory)}
                  activeOpacity={0.7}
                >
                  <View style={styles.fieldContent}>
                    <Checkbox.Android
                      status={includeHistory ? 'checked' : 'unchecked'}
                      onPress={() => setIncludeHistory(!includeHistory)}
                      color={appColors.primary}
                      uncheckedColor={appColors.textTertiary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Include Inspection History</Text>
                      <Text style={styles.fieldDescription}>
                        Add all {allInspections.length} inspections to the report
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="history" size={20} color={appColors.textSecondary} />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Bottom spacer so last item isn't hidden behind footer */}
          <View style={{ height: 12 }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {generating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={appColors.primary} />
              <Text style={styles.loadingText}>Generating PDF...</Text>
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => handleGenerate('preview')}
                style={styles.previewButton}
                activeOpacity={0.9}
              >
                <MaterialCommunityIcons name="eye" size={20} color={appColors.white} />
                <Text style={styles.previewButtonText}>Preview PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleGenerate('download')}
                style={styles.shareButton}
                activeOpacity={0.9}
              >
                <MaterialCommunityIcons name="share-variant" size={20} color={appColors.primary} />
                <Text style={styles.shareButtonText}>Share PDF</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </Portal>
  );
}

const getPDFPreviewModalStyles = (colors: AppColors) => StyleSheet.create({
  modalContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 40,
    borderRadius: 16,
    maxHeight: '85%',
    minHeight: '70%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
    marginTop: -4,
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  summaryCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  bulkActions: {
    flexDirection: 'row',
    gap: 10,
  },
  bulkButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: 6,
  },
  bulkButtonPrimaryText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  bulkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 6,
  },
  bulkButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
    marginTop: 6,
  },

  fieldsList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  fieldRowLast: {
    borderBottomWidth: 0,
  },
  fieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },

  fieldDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyCard: {
    backgroundColor: colors.surfaceVariant, // or a specific color if needed
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  buttonContainer: {
    gap: 10,
  },

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  previewButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  previewButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  shareButton: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  shareButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
