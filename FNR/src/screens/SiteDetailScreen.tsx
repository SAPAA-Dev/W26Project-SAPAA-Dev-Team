import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, FlatList, TouchableOpacity, Platform, RefreshControl } from 'react-native';
import { Button, Card, ActivityIndicator, Badge, Paragraph, Portal, Modal, useTheme } from 'react-native-paper';
import { NavigationProp, RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getInspectionDetailsOnline, InspectionDetail, getImages, getPdfs, getInspections, Image as Img, Pdf, Inspection } from '../services/database';
import NetInfo from '@react-native-community/netinfo';
import * as SQLite from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { daysSince } from './HomeScreen';
import { LineChart } from 'react-native-chart-kit';
import Markdown from 'react-native-markdown-display';
import { getSiteDetailScreenStyles, getMarkdownStyles } from './styles/SiteDetailScreen.styles';
import { AppColors } from '../theme/colors';
import PDFPreviewModal from '../components/PDFPreviewModal';

type DetailRouteProp = RouteProp<RootStackParamList, 'Detail'>;
type NavProp = NativeStackNavigationProp<RootStackParamList, 'PDFViewer'>;

type ViewMode = 'by-date' | 'by-question';

interface ParsedQuestion {
  questionId: string;
  questionText: string;
}

interface QuestionComparison {
  questionId: string;
  questionText: string;
  answers: Array<{
    inspectionId: number;
    date: string;
    answer: string;
  }>;
}

export default function SiteDetailScreen({ route }: { route: DetailRouteProp }) {
    const { site } = route.params;
    const nav = useNavigation<NavProp>();
    
    const theme = useTheme();
    const appColors = theme.colors as unknown as AppColors;
    const styles = useMemo(() => getSiteDetailScreenStyles(appColors), [appColors]);
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
    const [selectedInspection, setSelectedInspection] = useState<InspectionDetail |null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [refresh, setRefresh] = useState(false);
    
    // NEW: State for tab view mode
    const [viewMode, setViewMode] = useState<ViewMode>('by-date');
    const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
    const [pdfModalVisible, setPdfModalVisible] = useState(false);

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

    const renderImage = ({ item }: { item: Img }) => {
        const uri = imageUri[item.id];
        if (!uri) return <Text>Loading...</Text>;

        return (
            <View style={styles.imageCard}>
                <Image source={{ uri }} style={styles.img} resizeMode='cover' testID={`site-image-${item.id}`}/>
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

    // NEW: Toggle question expansion
    const toggleQuestion = (questionId: string) => {
        setExpandedQuestions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                newSet.add(questionId);
            }
            return newSet;
        });
    };

    // Convert inspectoin entry to Markdown
    const inspectionToMarkdown = (inspection: InspectionDetail) => {
        let md = `# Inspection ${inspection.inspectno}\n`;

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
                md += `**${field.label}:** ${field.value}\n`;
            }
        });

        // print observations
        if (inspection.notes) {
            md += '## Observations\n\n';
            const formattedNotes = formatNotes(inspection.notes)
                .split('\n')
                .map(line => `- ${line}`)
                .join('\n');
            md += formattedNotes + '\n\n';
        }
        return md;
    };

    const MarkdownModal = () => {
        if (!selectedInspection) return null;

        const markdown = inspectionToMarkdown(selectedInspection);

        return (
            <Portal>
                <Modal
                    visible={modalVisible}
                    onDismiss={() => setModalVisible(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <View style={{ overflow: 'hidden' }}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                        Report: {new Date(selectedInspection.inspectdate).toLocaleDateString()}
                        </Text>
                        <Button onPress={() => setModalVisible(false)} testID="pdf-close">Close</Button>
                    </View>

                    <ScrollView 
                        contentContainerStyle={{ padding: 16 }} 
                        style={{ maxHeight: '90%' }} 
                        showsVerticalScrollIndicator
                    >
                        <Markdown style={markdownStyles}>
                            {inspectionToMarkdown(selectedInspection)}
                        </Markdown>
                    </ScrollView>

                    </View>
                </Modal>
                </Portal>

        );
    };

    // format observations (report questions)
    const formatNotes = (notes: string | null): string => {
        if (!notes) return '';

        // split by semicolor and space (from STRING_AGG)
        const observations = notes.split('; ').filter(obs => obs.trim() !== '');

        // ensure each observation starts with "Q##"
        const formatted = observations
            .map(obs => {
                if (/^Q\d+/.test(obs)) {
                    return obs;
                }
                // if observation doesn't start with Q## prefix with Q??_
                return `Q??_${obs}`;
            })
            .join('\n');
        return formatted;
    };

    // NEW: Parse questions from notes string
    const parseQuestions = (notes: string | null): ParsedQuestion[] => {
        if (!notes) return [];
        const observations = notes.split('; ').filter(obs => obs.trim() !== '');
        return observations.map(obs => {
            const match = obs.match(/^(Q\d+)[_:\s]+(.*)/);
            if (match) {
                return {
                    questionId: match[1],
                    questionText: match[2]
                };
            }
            return {
                questionId: 'Q??',
                questionText: obs
            };
        });
    };

    // NEW: Build question comparison data
    const buildQuestionComparison = (): QuestionComparison[] => {
        const questionMap = new Map<string, QuestionComparison>();

        // Process each inspection
        inspections.forEach(inspection => {
            const questions = parseQuestions(inspection.notes);
            
            questions.forEach(q => {
                if (!questionMap.has(q.questionId)) {
                    questionMap.set(q.questionId, {
                        questionId: q.questionId,
                        questionText: q.questionText,
                        answers: []
                    });
                }
                
                questionMap.get(q.questionId)!.answers.push({
                    inspectionId: inspection.id,
                    date: new Date(inspection.inspectdate).toLocaleDateString(),
                    answer: q.questionText
                });
            });
        });

        // Convert to array and sort by question ID
        return Array.from(questionMap.values()).sort((a, b) => {
            const numA = parseInt(a.questionId.replace('Q', ''));
            const numB = parseInt(b.questionId.replace('Q', ''));
            if (isNaN(numA)) return 1;
            if (isNaN(numB)) return -1;
            return numA - numB;
        });
    };

    const questionComparisons = buildQuestionComparison();

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

    // NEW: Render tab buttons
    const TabButtons = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tab, viewMode === 'by-date' && styles.activeTab]}
                onPress={() => setViewMode('by-date')}
            >
                <MaterialCommunityIcons 
                    name='calendar' 
                    size={18} 
                    color={viewMode === 'by-date' ? appColors.primary : appColors.icon} 
                />
                <Text style={[styles.tabText, viewMode === 'by-date' && styles.activeTabText]}>
                    By Date
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, viewMode === 'by-question' && styles.activeTab]}
                onPress={() => setViewMode('by-question')}
            >
                <MaterialCommunityIcons 
                    name='format-list-numbered' 
                    size={18} 
                    color={viewMode === 'by-question' ? appColors.primary : appColors.icon} 
                />
                <Text style={[styles.tabText, viewMode === 'by-question' && styles.activeTabText]}>
                    By Question
                </Text>
            </TouchableOpacity>
        </View>
    );

    // NEW: Render by-date view (original)
    const ByDateView = () => (
        <>
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
                                name={isExpanded ? 'chevron-down' : 'chevron-right'}
                                size={20}
                                color={appColors.icon}
                            />
                        </TouchableOpacity>
                    </View>
                );
            })}
        </>
    );

    // NEW: Render by-question view (comparison view)
    const ByQuestionView = () => (
        <>
            {questionComparisons.map((qComp) => {
                const isExpanded = expandedQuestions.has(qComp.questionId);
                return (
                    <View key={qComp.questionId} style={styles.questionCard}>
                        <TouchableOpacity
                            style={styles.questionHeader}
                            onPress={() => toggleQuestion(qComp.questionId)}
                        >
                            <View style={styles.questionTitleContainer}>
                                <MaterialCommunityIcons 
                                    name='help-circle-outline' 
                                    size={18} 
                                    color={appColors.primary} 
                                />
                                <Text style={styles.questionId}>{qComp.questionId}</Text>
                            </View>
                            <MaterialCommunityIcons
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={appColors.icon}
                            />
                        </TouchableOpacity>
                        
                        {isExpanded && (
                            <View style={styles.answersContainer}>
                                {qComp.answers.map((answer, idx) => (
                                    <View key={`${answer.inspectionId}-${idx}`} style={styles.answerItem}>
                                        <View style={styles.answerHeader}>
                                            <MaterialCommunityIcons 
                                                name='calendar' 
                                                size={14} 
                                                color={appColors.icon} 
                                            />
                                            <Text style={styles.answerDate}>{answer.date}</Text>
                                        </View>
                                        <Text style={styles.answerText}>{answer.answer}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                );
            })}
        </>
    );

    // loading state
    if (loading || isOnline === null) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" />
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
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} />}>
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
                                    color={appColors.icon}
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
                                    Last Inspection: {new Date(site.inspectdate).toLocaleDateString()}
                                </Text>
                            </View>
                        )}
                    </View>
                    
                    <View style={styles.ageBadge}>
                        <Text style={styles.ageBadgeText}>{ageText}</Text>
                    </View>
                </View>
                {inspections.length > 0 && (
                    <TouchableOpacity
                        style={styles.pdfButton}
                        onPress={() => setPdfModalVisible(true)}
                        testID="generate-report"
                    >
                        <MaterialCommunityIcons name="file-pdf-box" size={20} color="#fff" />
                        <Text style={styles.pdfButtonText}>Generate Report</Text>
                    </TouchableOpacity>
                )}
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

            {/* Inspection Reports with Tabs - MODIFIED SECTION */}
            {inspections.length > 0 && (
                <View style={styles.infoCard}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name='file-document-multiple' size={22} color={appColors.text} />
                        <Text style={styles.sectionTitle}>Inspection Reports</Text>
                    </View>

                    {/* NEW: Tab buttons */}
                    <TabButtons />

                    {/* NEW: Conditional rendering based on view mode */}
                    {viewMode === 'by-date' ? <ByDateView /> : <ByQuestionView />}
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
            <MarkdownModal />
            {inspections.length > 0 && (
                <PDFPreviewModal
                    visible={pdfModalVisible}
                    onDismiss={() => setPdfModalVisible(false)}
                    site={site}
                    inspection={inspections[0]}
                    allInspections={inspections}
                    onPreview={(uri) => {
                        nav.navigate('PDFViewer', { uri });
                    }}
                />
            )}
        </ScrollView>
    );
}