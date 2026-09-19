import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, FlatList, TouchableOpacity, Platform, RefreshControl, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Button, Card, ActivityIndicator as PaperActivityIndicator, Badge, Paragraph, Portal, Modal, useTheme, } from 'react-native-paper';
import { NavigationProp, RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { updateInspectionOnline, deleteSiteReportOnline, getInspectionDetailsOnline, InspectionDetail, getImages, getPdfs, getInspections, Image as Img, Pdf, Inspection } from '../services/database';
import NetInfo from '@react-native-community/netinfo';
import * as SQLite from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { daysSince } from './HomeScreen';
import { LineChart } from 'react-native-chart-kit';
import Markdown from 'react-native-markdown-display';
import { styles, getAdminSiteDetailScreenStyles, getMarkdownStyles } from './styles/AdminSiteDetailScreen.styles';
import { MaterialIcons } from '@expo/vector-icons'
import { AppColors } from '../theme/colors';

type DetailRouteProp = RouteProp<RootStackParamList, 'Detail'>;
type NavProp = NativeStackNavigationProp<RootStackParamList, 'PDFViewer'>;


const EditableField = React.memo(({ 
    label, 
    value, 
    onChangeText, 
    placeholder,
    multiline = false,
    height,
    colors
}: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    multiline?: boolean;
    height?: number;
    colors: AppColors;
}) => {
    const styles = useMemo(() => getAdminSiteDetailScreenStyles(colors), [colors]);
    
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={styles.editFieldLabel}>{label}:</Text>
            <TextInput
                style={[
                    styles.editInput,
                    height ? { height } : undefined
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.textTertiary}
                multiline={multiline}
                textAlignVertical={multiline ? "top" : "center"}
                autoCorrect={false}
            />
        </View>
    );
});

const ObservationField = React.memo(({ 
    label, 
    content, 
    index, 
    onChangeText,
    colors
}: { 
    label: string; 
    content: string; 
    index: number; 
    onChangeText: (index: number, label: string, text: string) => void;
    colors: AppColors;
}) => {
    const styles = useMemo(() => getAdminSiteDetailScreenStyles(colors), [colors]);
    
    const handleChange = useCallback((text: string) => {
        onChangeText(index, label, text);
    }, [index, label, onChangeText]);

    return (
        <View style={styles.observationEditItem}>
            <Text style={styles.observationEditLabel}>{label}:</Text>
            <TextInput
                style={[styles.editInput, styles.observationEditInput]}
                value={content}
                onChangeText={handleChange}
                placeholder="Enter observation content"
                placeholderTextColor={colors.textTertiary}
                multiline
                textAlignVertical="top"
                autoCorrect={false}
            />
        </View>
    );
});

interface MarkdownModalProps {
    visible: boolean;
    selectedInspection: InspectionDetail | null;
    editedInspection: InspectionDetail | null;
    isEditing: boolean;
    isSaving: boolean;
    onDismiss: () => void;
    onEditToggle: () => void;
    onDelete: () => void;
    onStewardChange: (text: string) => void;
    onStewardGuestChange: (text: string) => void;
    onNaturalnessScoreChange: (text: string) => void;
    onNaturalnessDetailsChange: (text: string) => void;
    onObservationChange: (index: number, label: string, text: string) => void;
    inspectionToMarkdown: (inspection: InspectionDetail) => string;
}

export const MarkdownModalComponent = React.memo(({ 
    visible,
    selectedInspection,
    editedInspection,
    isEditing,
    isSaving,
    onDismiss,
    onEditToggle,
    onDelete,
    onStewardChange,
    onStewardGuestChange,
    onNaturalnessScoreChange,
    onNaturalnessDetailsChange,
    onObservationChange,
    inspectionToMarkdown
}: MarkdownModalProps) => {
    if (!selectedInspection) return null;

    const displayInspection = isEditing && editedInspection ? editedInspection : selectedInspection;
    if (!displayInspection) return null;

    const markdown = inspectionToMarkdown(displayInspection);
    const theme = useTheme();
    const appColors = theme.colors as unknown as AppColors;
    const styles = useMemo(() => getAdminSiteDetailScreenStyles(appColors), [appColors]);
    const markdownStyles = useMemo(() => getMarkdownStyles(appColors), [appColors]);

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={styles.modalContainer}
            >
                <View style={styles.modalHeader}>
                    <Text style={styles.modalHeaderText}>
                        Report: {displayInspection.inspectdate.substring(0, 10)}
                    </Text>
                    <View style={styles.modalActions}>
                        <TouchableOpacity onPress={onDelete}>
                            <MaterialIcons testID="delete-button" name="delete-outline" size={30} color="#ff4d4f" />
                        </TouchableOpacity>
                        <Button 
                            onPress={onEditToggle}
                            mode={isEditing ? 'contained' : 'outlined'}
                            buttonColor='#2E7D32'
                            textColor='white'
                            style={styles.actionButton}
                        >
                            {isEditing ? 'Save' : 'Edit'}
                        </Button>
                    </View>
                </View>

                <ScrollView 
                    style={{ maxHeight: 600, marginTop: 12}}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="none"
                >
                    {!isEditing ? (
                        <Markdown style={markdownStyles}>
                            {markdown}
                        </Markdown>
                    ) : (
                        <View style={styles.markdownContainer}>
                            <Text style={styles.editModeTitle}>
                                Inspection {displayInspection.inspectno}
                            </Text>

                            <EditableField
                                label="Steward"
                                value={editedInspection?.steward || ''}
                                onChangeText={onStewardChange}
                                placeholder="Enter steward name"
                                colors={appColors}
                            />

                            <EditableField
                                label="Steward Guest"
                                value={editedInspection?.steward_guest || ''}
                                onChangeText={onStewardGuestChange}
                                placeholder="Enter steward guest"
                                colors={appColors}
                            />

                            <EditableField
                                label="Naturalness Score"
                                value={editedInspection?.naturalness_score || ''}
                                onChangeText={onNaturalnessScoreChange}
                                placeholder="Enter naturalness score"
                                colors={appColors}
                            />

                            <EditableField
                                label="Naturalness Details"
                                value={editedInspection?.naturalness_details || ''}
                                onChangeText={onNaturalnessDetailsChange}
                                placeholder="Enter naturalness details"
                                multiline
                                height={80}
                                colors={appColors}
                            />

                            <View style={{ marginBottom: 16 }}>
                                <Text style={styles.observationsSectionLabel}>Observations:</Text>
                                {(() => {
                                    const notes = editedInspection?.notes || '';
                                    const observations = notes
                                        .split('; ')
                                        .map(obs => obs.trim())
                                        .filter(obs => obs.length > 0);

                                    return observations.map((obs, index) => {
                                        const match = obs.match(/^(Q\d+[^:]*?):\s*(.*)$/);
                                        
                                        if (match) {
                                            const label = match[1];
                                            const content = match[2];

                                            return (
                                                <ObservationField
                                                    key={`obs-${label}-${index}`}
                                                    label={label}
                                                    content={content}
                                                    index={index}
                                                    onChangeText={onObservationChange}
                                                    colors={appColors}
                                                />
                                            );
                                        } else {
                                            return (
                                                <View key={`text-${index}`} style={{ marginBottom: 8 }}>
                                                    <Text style={styles.plainObservationText}>• {obs}</Text>
                                                </View>
                                            );
                                        }
                                    });
                                })()}
                            </View>
                        </View>
                    )}
                </ScrollView>

                {isSaving && (
                    <View style={styles.savingOverlay}>
                        <ActivityIndicator animating={true} size={50} color={appColors.primary} />
                        <Text style={styles.savingText}>Saving changes...</Text>
                    </View>
                )}
            </Modal>
        </Portal>
    );
});

export default function AdminSiteDetailScreen({ route }: { route: DetailRouteProp }) {
    const { site } = route.params;
    const nav = useNavigation<NavProp>();
    
    const theme = useTheme();
    const appColors = theme.colors as unknown as AppColors;
    const styles = useMemo(() => getAdminSiteDetailScreenStyles(appColors), [appColors]);
    const markdownStyles = useMemo(() => getMarkdownStyles(appColors), [appColors]);

    const [images, setImages] = useState<Img[]>([]);
    const [pdfs, setPdfs] = useState<Pdf[]>([]);
    const [imageUri, setImageUri] = useState<Record<number, string>>({});
    const [pdfUri, setPdfUri] = useState<Record<number, string>>({});
    const [inspections, setInspections] = useState<InspectionDetail[]>([]);
    const [isOnline, setIsOnline] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedInspections, setExpandedInspections] = useState<Set<number>>(new Set());
    const [selectedInspection, setSelectedInspection] = useState<InspectionDetail | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editedInspection, setEditedInspection] = useState<InspectionDetail | null>(null);

    // check network status
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected);
        });
        return () => unsubscribe();
    }, []);

    const onRefresh = async () => {
        setRefresh(true);
        await loadInspections();
        setRefresh(false);
    };
    
    // load inspections based on network status
    const loadInspections = async () => {
        setLoading(true);
        try {
            if (isOnline) {
                const onlineInsps = await getInspectionDetailsOnline(site.namesite!);
                setInspections(onlineInsps);
            } else {
                const database = await SQLite.openDatabaseAsync(`sites/${site.namesite}/data.sqlite`);
                const results = await database.getAllAsync<InspectionDetail>('SELECT * FROM inspections ORDER BY inspectdate DESC');
                setInspections(results);
                await updateLastAccessed(site.namesite!);
            }
        } catch (err: any) {
            setError(err.message ?? 'Error loading inspections'); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOnline !== null) {
            loadInspections();
        }
    }, [site.namesite, isOnline]);

    const computeAverageNaturalness = (inspections: InspectionDetail[]) => {
        const scores: number[] = [];
        const numberRegex = /^(\d+(?:\.\d+)?)/;

        for (const insp of inspections) {
            const value = insp.naturalness_score;
            if (typeof value !== 'string') continue;

            const trimmed = value.trim();
            const match = trimmed.match(numberRegex);
            if (match) {
                const num = parseFloat(match[1]);
                if(!isNaN(num) && isFinite(num)) {
                    scores.push(num);
                }
            }
        }

        if (scores.length === 0) {
            return { average: null, text: 'N/A' };
        }

        const average = scores.reduce((a, b) => a + b, 0) / scores.length;
        const roundedAvg = Math.round(average * 10) / 10;

        // Convert to text description (adjust ranges as needed)
        let text = 'N/A';
        if (roundedAvg >= 4) text = `${roundedAvg} - Excellent`;
        else if (roundedAvg >= 3) text = `${roundedAvg} - Good`;
        else if (roundedAvg >= 2) text = `${roundedAvg} - Fair`;
        else if (roundedAvg >= 1) text = `${roundedAvg} - Poor`;

        return { average: roundedAvg, text };
    };

    const { average, text: avgText } = computeAverageNaturalness(inspections);

    const updateLastAccessed = async (siteName: string) => {
        try {
            const siteDir = `${FileSystemLegacy.documentDirectory}sites/${siteName}/`;
            const metaPath = `${siteDir}meta.json`;
            const metaStr = await FileSystemLegacy.readAsStringAsync(metaPath);
            const meta = JSON.parse(metaStr);
            meta.lastAccessed = Date.now();
            await FileSystemLegacy.writeAsStringAsync(metaPath, JSON.stringify(meta));
            console.log(`Updated lastAccessed for ${siteName}`);
        } catch (err) {
            console.warn(`Failed to update lastAccessed for ${siteName}:`, err);
        }
    };

    // Handle edit mode toggle
    const handleEditToggle = () => {
        if (isEditing) {
            // Save changes
            handleSaveInspection();
        } else {
            // Enter edit mode
            setEditedInspection(selectedInspection ? { ...selectedInspection } : null);
            setIsEditing(true);
        }
    };

    // Save edited inspection
    const handleSaveInspection = async () => {
        if (!editedInspection) return;

        setIsSaving(true); // START LOADING
        try {
            // Save changes to Supabase
            await updateInspectionOnline(editedInspection);

            // Update local state so UI shows changes
            setInspections(prev =>
                prev.map(insp =>
                    insp.id === editedInspection.id ? editedInspection : insp
                )
            );

            setSelectedInspection(editedInspection);
            setIsEditing(false);

            Alert.alert('Success', 'Changes saved to Supabase!');
        } catch (err: any) {
            console.error('Error saving inspection to Supabase:', err);
            Alert.alert('Error', `Failed to save changes: ${err.message}`);
        } finally {
            setIsSaving(false); // STOP LOADING
        }
    };


    // Delete inspection
    const handleDeleteInspection = () => {
        if (!selectedInspection) return;

        Alert.alert(
            'Delete Inspection',
            `Are you sure you want to delete this inspection from ${selectedInspection.namesite}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (isOnline) {
                                // delete from Supabase
                                await deleteSiteReportOnline(selectedInspection.id);
                                Alert.alert('Success', 'Inspection deleted from Supabase.');
                            } else {
                                const database = await SQLite.openDatabaseAsync(`sites/${site.namesite}/data.sqlite`);
                                await database.runAsync('DELETE FROM inspections WHERE id = ?', [selectedInspection.id]);
                                Alert.alert('Success', 'Inspection deleted locally.');
                            }

                            // update local state
                            setInspections(prev => prev.filter(insp => insp.id !== selectedInspection.id));
                            setModalVisible(false);
                            setIsEditing(false);
                            setSelectedInspection(null);
                        } catch (err: any) {
                            console.error('Error deleting inspection:', err);
                            Alert.alert('Error', 'Failed to delete inspection');
                        }
                    }
                }
            ]
        );
    };


    const renderImage = ({ item }: { item: Img }) => {
        const uri = imageUri[item.id];
        if (!uri) return <Text style={{ color: appColors.text }}>Loading...</Text>;

        return (
            <View style={styles.imageCard}>
                <Image source={{ uri }} style={styles.img} resizeMode='cover' />
            </View>
        );
    };

    const formatAgeBadge = (days: number): string => {
        if (!days) return 'N/A';
        if (days < 0) return '0d';
        if (days < 30) return `${days}D`;
        if (days < 365) return `${Math.floor(days / 30)}M`;
        return `${Math.floor(days / 365)}Y`;
    };

    // Format inspection name for display
    const formatInspectionName = (inspection: InspectionDetail) => {
        const date = new Date(inspection.inspectdate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day} ${site.namesite}`;
    };

    // Toggle inspection expansion
    const toggleInspection = (id: number) => {
        setExpandedInspections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // Convert inspection entry to Markdown
    const inspectionToMarkdown = (inspection: InspectionDetail) => {
        let md = `# Inspection ${inspection.inspectno}\n\n`;

        // add fields
        const fields = [
            { label: 'Steward', value: inspection.steward },
            { label: 'Steward Guest', value: inspection.steward_guest },
            { label: 'Naturalness Score', value: inspection.naturalness_score },
            { label: 'Naturalness Details', value: inspection.naturalness_details },
        ];

        // print fields
        fields.forEach(field => {
            if (field.value) {
                md += `**${field.label}:** ${field.value}\n\n`;
            }
        });

        // print observations
        if (inspection.notes) {
            md += '## Observations\n\n';
            const observations = formatNotes(inspection.notes)
                .split('\n')
                .filter(line => line.trim().length > 0);
            
            const formattedObs = observations
                .map(line => `- ${line}`)
                .join('\n');
            md += formattedObs + '\n\n';
            }
        return md;
    };

    const updateField = useCallback((field: keyof InspectionDetail, value: string) => {
        setEditedInspection(prev => {
            if (!prev) return null;
            return { ...prev, [field]: value };
        });
    }, []);

    const handleStewardChange = useCallback((text: string) => updateField('steward', text), [updateField]);
    const handleStewardGuestChange = useCallback((text: string) => updateField('steward_guest', text), [updateField]);
    const handleNaturalnessScoreChange = useCallback((text: string) => updateField('naturalness_score', text), [updateField]);
    const handleNaturalnessDetailsChange = useCallback((text: string) => updateField('naturalness_details', text), [updateField]);

    const handleObservationChange = useCallback((index: number, label: string, text: string) => {
        setEditedInspection(prev => {
            if (!prev) return null;
            const currentObs = prev.notes?.split('; ').map(o => o.trim()).filter(o => o.length > 0) || [];
            currentObs[index] = `${label}: ${text}`;
            return { ...prev, notes: currentObs.join('; ') };
        });
    }, []);

    const handleModalDismiss = useCallback(() => {
        setModalVisible(false);
        setIsEditing(false);
        setEditedInspection(null);
    }, []);


    // format observations (report questions)
    const formatNotes = (notes: string | null): string => {
        if (!notes) return '';

        // Split by semicolon and filter out empty entries
        const observations = notes
            .split('; ')
            .map(obs => obs.trim())
            .filter(obs => obs.length > 0);

        return observations.join('\n');
    };

    // Get condition label and position for gradient slider
    const getConditionInfo = (score: number | null) => {
        if (score === null) return { label: 'N/A', position: 0 };
        
        // Position on 1-4 scale (converted to percentage)
        const normalizedPosition = (score - 1) / 3;
        const position = 5 + (normalizedPosition * 90);
        
        let label = 'Poor';
        if (score >= 3.5) label = 'Excellent';
        else if (score >= 2.5) label = 'Good';
        else if (score >= 1.5) label = 'Average';
        else label = 'Poor';
        
        return { label, position: Math.min(Math.max(position, 5), 95) };
    };

    // loading state
    if (loading || isOnline === null) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={appColors.primary} />
                <Text style={styles.loadingText}>
                    {isOnline === null ? 'Checking network...' : 'Loading site details...'}
                </Text>
            </View>
        );
    }

    // error state
    if (error) {
        return (
            <View style={styles.centerContainer}>
                <MaterialCommunityIcons name="alert-circle" size={48} color={appColors.error} />
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    const age = daysSince(site.inspectdate ?? '1900-01-01');
    const ageText = formatAgeBadge(age);
    const conditionInfo = getConditionInfo(average);

    return (
        <ScrollView testID="scroll-view" style={styles.container} contentContainerStyle={styles.contentContainer} refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} />}>
            {/* Header Section */}
            <View style={styles.headerCard}>
                <View style={styles.headerTop}>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.siteName}>{site.namesite}</Text>
                        {site.county && (
                            <View style={styles.locationRow}>
                                <MaterialCommunityIcons
                                    name='map-marker'
                                    size={18}
                                    color={appColors.textSecondary}
                                />
                                <Text style={styles.countyText}>{site.county}</Text>
                            </View>
                        )}
                        {site.inspectdate && (
                            <View style={styles.inspectionDateRow}>
                                <MaterialCommunityIcons
                                    name='calendar-clock'
                                    size={18}
                                    color={appColors.textTertiary}
                                />
                                <Text style={styles.inspectionDateText}>
                                    Last Inspection: {site.inspectdate.substring(0, 10)}
                                </Text>
                            </View>
                        )}
                    </View>
                    
                    <View style={styles.ageBadge}>
                        <Text style={styles.ageBadgeText}>{ageText}</Text>
                    </View>
                </View>
            </View>

            {/* Reports Count */}
            {inspections.length > 0 && (
                <View style={styles.reportsCountCard}>
                    <Text style={styles.reportsCountLabel}>Reports:</Text>
                    <Text style={styles.reportsCountValue}>{inspections.length}</Text>
                </View>
            )}

            {/* Average Naturalness with Gradient Slider */}
            {inspections.length > 0 && average !== null && (
                <View style={styles.gradientCard}>
                    <View style={styles.gradientHeader}>
                        <Text style={styles.gradientTitle}>Average Naturalness Score</Text>
                        <Text style={styles.gradientScore}>{average}</Text>
                    </View>
                    
                    <View style={styles.gradientContainer}>
                        {/* Gradient bar */}
                        <View style={styles.gradientBar}>
                            <View style={[styles.gradientSegment, { backgroundColor: '#DC2626', flex: 1 }]} />
                            <View style={[styles.gradientSegment, { backgroundColor: '#EAB308', flex: 1 }]} />
                            <View style={[styles.gradientSegment, { backgroundColor: '#84CC16', flex: 1 }]} />
                            <View style={[styles.gradientSegment, { backgroundColor: '#22C55E', flex: 1 }]} />
                        </View>
                        
                        {/* Position indicator */}
                        <View style={[styles.indicator, { left: `${conditionInfo.position}%` }]}>
                            <View style={styles.indicatorTriangle} />
                            <View style={styles.indicatorLine} />
                        </View>
                    </View>
                    
                    <View style={styles.gradientLabels}>
                        <Text style={styles.gradientLabel}>Poor</Text>
                        <Text style={styles.gradientLabel}>Average</Text>
                        <Text style={styles.gradientLabel}>Good</Text>
                        <Text style={styles.gradientLabel}>Excellent</Text>
                    </View>
                    
                    <Text style={styles.conditionText}>Condition: {conditionInfo.label}</Text>
                </View>
            )}
            {/* Site Details Card */}
            {inspections.length > 0 && (
                <View style={styles.infoCard}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name='information' size={22} color={appColors.text} />
                        <Text style={styles.sectionTitle}>Site Details</Text>
                        <Text style={styles.detailLabel}>Site ID: {inspections[0].iddetail}</Text>
                    </View>

                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Type</Text>
                            <Text style={styles.detailValue}>{inspections[0]._type || 'N/A'}: {inspections[0]._subtype || 'N/A'}</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Region</Text>
                            <Text style={styles.detailValue}>{inspections[0]._naregion || 'N/A'}; {inspections[0]._na_subregion_multi || 'N/A'}</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Area HA/AC</Text>
                            <Text style={styles.detailValue}>{inspections[0].area_ha || 'N/A'} / {inspections[0].area_acre || 'N/A'}</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Recreational Activities</Text>
                            <Text style={styles.detailValue}>{inspections[0].recactivities_multi || 'N/A'}</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>SAPAA Link</Text>
                            <Text style={styles.detailValue}>{inspections[0].sapaaweb || 'N/A'}</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>iNaturalMap</Text>
                            <Text style={styles.detailValue}>{inspections[0].inatmap || 'N/A'}</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Avg. Naturalness</Text>
                            <Text style={styles.detailValue}>{average !== null ? average : 'N/A'}</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Recent Score</Text>
                            <Text style={styles.detailValue}>{inspections[0].naturalness_score || 'N/A'}</Text>
                        </View>
                    </View>

                    {inspections[0].naturalness_details && (
                        <View style={styles.detailsNote}>
                            <Text style={styles.detailsNoteLabel}>Naturalness Details:</Text>
                            <Text style={styles.detailsNoteText}>{inspections[0].naturalness_details}</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Expandable Inspection Cards */}
            {inspections.length > 0 && (
                <View style={styles.infoCard}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name='file-document-multiple' size={22} color={appColors.text} />
                        <Text style={styles.sectionTitle}>Inspection Reports</Text>
                    </View>

                    {inspections.map((inspection) => {
                        const isExpanded = expandedInspections.has(inspection.id);
                        return (
                            <View key={inspection.id} style={styles.expandableCard}>
                                <TouchableOpacity
                                    style={styles.expandableHeader}
                                    onPress={() => {
                                        setSelectedInspection(inspection);
                                        setModalVisible(true);
                                    }}
                                >
                                    <MaterialCommunityIcons 
                                        name='file-document-outline' 
                                        size={18} 
                                        color={appColors.primary} 
                                    />
                                    <Text style={styles.expandableTitle}>
                                        {formatInspectionName(inspection)}
                                    </Text>
                                    <MaterialCommunityIcons
                                        name='chevron-right'
                                        size={20}
                                        color={appColors.icon}
                                    />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Images Section */}
            {images.length > 0 && (
                <View style={styles.infoCard}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name='image-multiple' size={22} color={appColors.text} />
                        <Text style={styles.sectionTitle}>Photos</Text>
                        <Badge style={styles.countBadge} size={22}>
                            {images.length}
                        </Badge>
                    </View>
                    <FlatList
                        horizontal
                        data={images}
                        renderItem={renderImage}
                        keyExtractor={(i) => i.id.toString()}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.imagesList}
                    />
                </View>
            )}

            {/* PDFs Section */}
            {pdfs.length > 0 && (
                <View style={styles.infoCard}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name='file-document' size={22} color={appColors.text} />
                        <Text style={styles.sectionTitle}>Reports</Text>
                        <Badge style={styles.countBadge} size={22}>
                            {pdfs.length}
                        </Badge>
                    </View>
                    {pdfs.map((p) => (
                        <TouchableOpacity 
                            key={p.id} 
                            style={styles.pdfItem}
                            onPress={() => nav.navigate('PDFViewer', { uri: pdfUri[p.id] })}
                        >
                            <View style={styles.pdfIcon}>
                                <MaterialCommunityIcons name='file-pdf-box' size={26} color={appColors.error} />
                            </View>
                            <Text style={styles.pdfText}>{p.generated_date ?? 'Report'}</Text>
                            <MaterialCommunityIcons name='chevron-right' size={22} color={appColors.textTertiary} />
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            <MarkdownModalComponent
                visible={modalVisible}
                selectedInspection={selectedInspection}
                editedInspection={editedInspection}
                isEditing={isEditing}
                isSaving={isSaving}
                onDismiss={handleModalDismiss}
                onEditToggle={handleEditToggle}
                onDelete={handleDeleteInspection}
                onStewardChange={handleStewardChange}
                onStewardGuestChange={handleStewardGuestChange}
                onNaturalnessScoreChange={handleNaturalnessScoreChange}
                onNaturalnessDetailsChange={handleNaturalnessDetailsChange}
                onObservationChange={handleObservationChange}
                inspectionToMarkdown={inspectionToMarkdown}
            />
        </ScrollView>
    );
}