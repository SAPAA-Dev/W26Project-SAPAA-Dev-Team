"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getFormResponsesBySite,
  getSiteByName,
  SiteSummary,
  FormResponse,
  FormAnswer,
} from "@/utils/supabase/queries";
import { daysSince } from "@/app/sites/page";
import { createClient } from "@/utils/supabase/client";
import Image from 'next/image'
import { 
  MoreVertical,
  ArrowLeft, 
  MapPin, 
  Calendar, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  TrendingUp,
  ClipboardList,
  Award,
  AlertCircle,
  Settings,
  X,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Search,
  Download,
  Save,
  Edit3,
  Loader2
} from "lucide-react";
import { useRef } from "react";

// Initialize Supabase client
const supabase = createClient();

// Extended InspectionDetail interface with all fields needed for editing
interface InspectionDetail {
  id: number;
  namesite: string;
  _type: string | null;
  county: string | null;
  _naregion: string | null;
  inspectdate: string | null;
  naturalness_score: string | null; 
  naturalness_details: string | null;
  notes: string | null;
  iddetail: string | null;
  _subtype: string | null;
  area_ha: string | null;
  area_acre: string | null;
  _na_subregion_multi: string | null;
  recactivities_multi: string | null;
  sapaaweb: string | null;
  inatmap: string | null;
  inspectno: string | null;
  steward: string | null;
  steward_id?: number | null;
  steward_guest: string | null;
  steward_guest_id?: number | null;
  category: number | null;
  definition: string | null;
  inspection_id?: number; 
  detail_row_ids?: Map<string, number>; 
  notes_row_mapping?: Array<{ observationCode: string; rowId: number; value: string; field: 'obs_value' | 'obs_comm' }>;
}

// Custom getInspectionDetailsOnline that fetches all necessary fields - matches app version
async function getInspectionDetailsOnline(siteName: string): Promise<InspectionDetail[]> {
  // First, get the inspection header IDs for this site (includes steward ID)
  const { data: headers, error: headerError } = await supabase
    .from('inspectheader')
    .select('id, inspectdate, inspectno, steward, "steward-guest"')
    .eq('q22-pasitename', siteName)
    .order('inspectdate', { ascending: false });

  if (headerError) throw headerError;

  // For each header, get the aggregated view data
  const inspections: InspectionDetail[] = [];
  
  for (const header of headers || []) {
    const { data: viewData, error: viewError } = await supabase
      .from('sites_report_fnr_test') // FOR TESTING
      //.from('sites_report_fnr')
      .select('*')
      .eq('namesite', siteName)
      .eq('inspectdate', header.inspectdate)
      .single();

    if (viewError) {
      console.warn(`Error fetching view data for inspection ${header.id}:`, viewError);
      continue;
    }

    // Fetch all inspectdetails rows with their IDs for this inspection
    const { data: detailRows, error: detailError } = await supabase
      .from('inspectdetails_fnr_test') // FOR TESTING
      //.from('inspectdetails')
      .select('id, observation, obs_value, obs_comm')
      .eq('inspection', header.id)
      .order('id', { ascending: true });

    if (detailError) {
      console.warn(`Error fetching detail rows for inspection ${header.id}:`, detailError);
    }

    // Get observation codes from inspectquestions
    const { data: questions, error: questionsError } = await supabase
      .from('inspectquestions')
      .select('id, observation');

    if (questionsError) {
      console.warn('Error fetching questions:', questionsError);
    }

    // Create mapping from observation ID to code (e.g., 1 -> "Q31_Naturalness")
    const obsIdToCode = new Map<number, string>();
    if (questions) {
      questions.forEach(q => {
        obsIdToCode.set(q.id, q.observation);
      });
    }

    // Build detailed mapping: track which row ID produced each observation
    const notesRowMapping: Array<{ observationCode: string; rowId: number; value: string; field: 'obs_value' | 'obs_comm' }> = [];
    if (detailRows && obsIdToCode.size > 0) {
      detailRows.forEach(row => {
        const code = obsIdToCode.get(row.observation);
        if (code && code !== 'Q31_Naturalness' && code !== 'Q32_Natural_Comm') {
          const value = row.obs_value || row.obs_comm;
          const field = row.obs_value !== null ? 'obs_value' : 'obs_comm';
          
          if (value) {
            notesRowMapping.push({
              observationCode: code,
              rowId: row.id,
              value: value, 
              field: field,
            });
          }
        }
      });
    }

    // Also keep the old detailRowIds map for naturalness fields
    const detailRowIds = new Map<string, number>();
    if (detailRows && obsIdToCode.size > 0) {
      detailRows.forEach(row => {
        const code = obsIdToCode.get(row.observation);
        if (code === 'Q31_Naturalness' || code === 'Q32_Natural_Comm') {
          detailRowIds.set(code, row.id);
        }
      });
    }

    inspections.push({
      id: inspections.length + 1, // Temp ID for UI
      inspection_id: header.id, // Real ID for updates - THIS IS THE KEY FIELD
      namesite: viewData.namesite,
      iddetail: viewData.iddetail,
      _type: viewData._type,
      _subtype: viewData._subtype,
      area_ha: viewData['area-ha'],
      area_acre: viewData['area-acre'],
      _naregion: viewData._naregion,
      _na_subregion_multi: viewData._na_subregion_multi,
      recactivities_multi: viewData['recactivities-multi'],
      sapaaweb: viewData.sapaaweb,
      inatmap: viewData.inatmap,
      inspectno: viewData.inspectno,
      inspectdate: viewData.inspectdate,
      steward: viewData.steward, // This is the displayname from the view
      steward_id: header.steward, // This is the ID from inspectheader
      steward_guest: header['steward-guest'], // This is a string
      category: viewData.category,
      definition: viewData.definition,
      county: viewData.county,
      naturalness_score: viewData.naturalness_score,
      naturalness_details: viewData.naturalness_details,
      notes: viewData.notes,
      detail_row_ids: detailRowIds,
      notes_row_mapping: notesRowMapping,
    });
  }

  return inspections;
}

// Update inspection online - matches app's updateInspectionOnline
async function updateInspectionOnline(editedInspection: InspectionDetail) {
  const inspectionId = editedInspection.inspection_id;
  if (!inspectionId) throw new Error('Missing inspection_id - cannot update');

  try {
    // Update steward name
    if (editedInspection.steward_id && editedInspection.steward !== null) {
      const { error: stewardError } = await supabase
        .from('luperson_fnr_test') // FOR TESTING
        //.from('luperson')
        .update({
          displayname: editedInspection.steward,
        })
        .eq('id', editedInspection.steward_id);

      if (stewardError) {
        console.error('Error updating steward:', stewardError);
        throw stewardError;
      }

      console.log(`Updated steward displayname for ID ${editedInspection.steward_id} to "${editedInspection.steward}"`);
    }

    // Update steward guest 
    if (editedInspection.steward_guest !== null) {
      const { error: guestError } = await supabase
        .from('inspectheader_fnr_test') // FOR TESTING
        //.from('inspectheader')
        .update({ 'steward-guest': editedInspection.steward_guest })
        .eq('id', inspectionId);

      if (guestError) {
        console.error('Error updating steward guest:', guestError);
        throw guestError;
      }
      console.log(`Updated steward guest for inspection ${inspectionId} to "${editedInspection.steward_guest}"`);
    } 

    // Update naturalness_score
    if (editedInspection.naturalness_score !== null) {
      const { error: scoreError } = await supabase
        .from('inspectdetails_fnr_test') // FOR TESTING
        //.from('inspectdetails')
        .update({ obs_value: editedInspection.naturalness_score })
        .eq('inspection', inspectionId)
        .eq('observation', 1);  // ID 1 = Q1_Naturalness
      if (scoreError) throw scoreError;
      console.log(`Updated naturalness score for inspection ${inspectionId} to "${editedInspection.naturalness_score}"`);
    }

    // Update naturalness_details
    if (editedInspection.naturalness_details !== null) {
      const { error: detailsError } = await supabase
        .from('inspectdetails_fnr_test') // FOR TESTING
        //.from('inspectdetails')
        .update({ obs_comm: editedInspection.naturalness_details })
        .eq('inspection', inspectionId)
        .eq('observation', 2);  // ID 2 = Q2_Natural_Comm
      if (detailsError) throw detailsError;
      console.log(`Updated naturalness details for inspection ${inspectionId}`);
    }

    // Update observations/notes 
    if (editedInspection.notes !== null && editedInspection.notes !== undefined) {
      const notesMapping = editedInspection.notes_row_mapping;
      
      if (!notesMapping || notesMapping.length === 0) {
        console.warn('No notes_row_mapping available, cannot update observations');
      } else {
        // Split notes into individual observations
        const observations = editedInspection.notes
          .split('; ')
          .map(obs => obs.trim())
          .filter(obs => obs.length > 0);

        // Track which mapping entries we've used
        const usedMappingIndices = new Set<number>();

        for (let i = 0; i < observations.length; i++) {
          const obs = observations[i];
          
          // Only process "Qxx_" style entries
          const match = obs.match(/^(Q\d+[^:]*?):\s*(.*)$/);
          if (!match) continue;

          const observationCode = match[1];
          const newValue = match[2];

          // Skip naturalness observations (already handled above)
          if (observationCode === 'Q31_Naturalness' || observationCode === 'Q32_Natural_Comm') {
            continue;
          }

          // Find the NEXT unused matching entry with this observation code
          let mappingEntry = null;
          for (let j = 0; j < notesMapping.length; j++) {
            if (usedMappingIndices.has(j)) continue;
            
            if (notesMapping[j].observationCode === observationCode) {
              mappingEntry = notesMapping[j];
              usedMappingIndices.add(j);
              break;
            }
          }

          if (!mappingEntry) {
            console.warn(`No available row mapping found for observation "${observationCode}" at position ${i}`);
            continue;
          }

          const rowId = mappingEntry.rowId;
          const updateField = mappingEntry.field;

          // Update using the unique row ID and correct field
          const { error: obsError } = await supabase
            .from('inspectdetails_fnr_test') // FOR TESTING
            //.from('inspectdetails')
            .update({ [updateField]: newValue })
            .eq('id', rowId);

          if (obsError) {
            console.error(`Error updating observation ${observationCode} (row ${rowId}):`, obsError);
            throw obsError;
          }

          console.log(`Updated observation ${observationCode} (row ${rowId}) in ${updateField} = "${newValue}"`);
        }
      }
    }

    console.log(`Successfully updated inspection ${inspectionId}`);
  } catch (error) {
    console.error('Error updating inspection:', error);
    throw error;
  }
}

// Delete site report online - matches app's deleteSiteReportOnline
async function deleteSiteReportOnline(inspectionId: number): Promise<void> {
  // Delete from inspectdetails
  const { error: detailError } = await supabase
    .from('inspectdetails_fnr_test') // FOR TESTING 
    //.from('inspectdetails')
    .delete()
    .eq('inspection', inspectionId);

  if (detailError) {
    console.error('Error deleting inspection details:', detailError);
    throw detailError;
  }

  console.log(`Successfully deleted inspection details for inspection ${inspectionId}`);
}

type ViewMode = 'by-date' | 'by-question';

interface ParsedQuestion {
  questionId: string;
  questionText: string;
}

interface ParsedObservation {
  label: string;
  content: string;
  originalIndex: number;
}

interface QuestionComparison {
  questionId: string;
  questionText: string; 
  answers: Array<{
    inspectionId: number;
    date: string;        
    displayDate: string; 
    answer: string;
  }>;
}

// Editable Field Component - matches app's EditableField
interface EditableFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  multiline = false 
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-[#254431] mb-2">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border-2 border-[#E4EBE4] rounded-lg p-3 text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-[#356B43] min-h-[100px] resize-y"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border-2 border-[#E4EBE4] rounded-lg p-3 text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-[#356B43]"
        />
      )}
    </div>
  );
};

// Observation Field Component - matches app's ObservationField
interface ObservationFieldProps {
  label: string;
  content: string;
  index: number;
  onChange: (index: number, label: string, text: string) => void;
}

const ObservationField: React.FC<ObservationFieldProps> = ({ 
  label, 
  content, 
  index, 
  onChange 
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(index, label, e.target.value);
  }, [index, label, onChange]);

  return (
    <div className="mb-3 bg-[#F7F2EA] rounded-lg p-4">
      <label className="block text-sm font-semibold text-[#356B43] mb-2">
        {label}:
      </label>
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Enter observation content"
        className="w-full border-2 border-[#E4EBE4] rounded-lg p-3 text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-[#356B43] min-h-[80px] resize-y bg-white"
      />
    </div>
  );
};

export default function AdminSiteDetails() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const namesite = decodeURIComponent(params.id);

  const [inspections, setInspections] = useState<FormResponse[]>([]);
  const [site, setSite] = useState<SiteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedInspections, setExpandedInspections] = useState<Set<number>>(new Set());
  const [selectedInspection, setSelectedInspection] = useState<InspectionDetail | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('by-date');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [showDataQuality, setShowDataQuality] = useState(false);
  
  // Edit modal state - matching app functionality
  const [editingInspection, setEditingInspection] = useState<InspectionDetail | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedInspection, setEditedInspection] = useState<InspectionDetail | null>(null);
  
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; open: boolean } | null>(null);
  const menuRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const menuButtonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  useEffect(() => {
    const load = async () => {
      try {
        const siteData = await getSiteByName(namesite);
        const details = await getFormResponsesBySite(siteData[0].namesite);
        setSite(siteData[0]);
        setInspections(details); // change state type to FormResponse[]
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error loading inspections';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [namesite]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showExportMenu && !target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showExportMenu]);

  // Close inspection menu when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId !== null) {
        const menuEl = menuRefs.current[openMenuId];
        if (menuEl && !menuEl.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const computeAverageNaturalness = (items: FormResponse[]) => {
    const scores: number[] = [];
    const re = /^(\d+(\.\d+)?)/;

    for (const it of items) {
      if (typeof it.naturalness_score !== "string") continue;
      const m = it.naturalness_score.trim().match(re);
      if (m) scores.push(parseFloat(m[1]));
    }

    if (scores.length === 0) return { average: null, text: "N/A" };

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const r = Math.round(avg * 10) / 10;

    let label = "N/A";
    if (r >= 3.5) label = "Excellent";
    else if (r >= 2.5) label = "Good";
    else if (r >= 1.5) label = "Fair";
    else label = "Poor";

    return { average: r, text: label };
  };

  const { average, text: avgText } = computeAverageNaturalness(inspections);

  const parseQuestions = (notes: string | null): ParsedQuestion[] => {
    if (!notes) return [];
    const observations = notes.split('; ').filter(obs => obs.trim() !== '');
    return observations.map(obs => {
      const match = obs.match(/^(Q\d+)[_:\s]+(.*)/);
      if (match) {
        return { questionId: match[1], questionText: match[2].trim() };
      }
      return { questionId: 'Q??', questionText: obs.trim() };
    });
  };

  // Parse observations for editing - matches app logic
  const parseObservations = (notes: string | null): ParsedObservation[] => {
    if (!notes) return [];
    const observations = notes
      .split('; ')
      .map(obs => obs.trim())
      .filter(obs => obs.length > 0);

    return observations.map((obs, index) => {
      const match = obs.match(/^(Q\d+[^:]*?):\s*(.*)$/);
      if (match) {
        return {
          label: match[1],
          content: match[2],
          originalIndex: index
        };
      }
      return {
        label: `Note ${index + 1}`,
        content: obs,
        originalIndex: index
      };
    });
  };

  // Convert inspection to markdown for display - matches app's inspectionToMarkdown
  const inspectionToMarkdown = (inspection: InspectionDetail): string => {
    let md = '';
    
    const fields = [
      { label: 'Steward', value: (inspection as any).steward },
      { label: 'Steward Guest', value: (inspection as any).steward_guest },
      { label: 'Naturalness Score', value: inspection.naturalness_score },
      { label: 'Naturalness Details', value: inspection.naturalness_details },
    ];

    fields.forEach(field => {
      if (field.value) {
        md += `**${field.label}:** ${field.value}\n\n`;
      }
    });

    if (inspection.notes) {
      md += '## Observations\n\n';
      const observations = inspection.notes
        .split('; ')
        .filter(line => line.trim().length > 0)
        .map(line => `- ${line}`)
        .join('\n');
      md += observations + '\n\n';
    }

    return md;
  };

  const normalizeScore = (score: string | null): string => {
    if (!score || score.trim() === '') return 'N/A';
    const trimmed = score.trim();
    if (trimmed.toLowerCase() === 'cannot answer') return 'Cannot Answer';
    return trimmed;
  };

  const questionComparisons = useMemo((): QuestionComparison[] => {
    const questionMap = new Map<
      string,
      { label: string; answers: QuestionComparison["answers"] }
    >();
  
    inspections.forEach((inspection) => {
      const questions = parseQuestions(inspection.notes);
  
      questions.forEach((q) => {
        const [rawLabel, ...rest] = q.questionText.split(":");
        const label = rawLabel.trim();
        const answerText = rest.join(":").trim();
  
        if (!questionMap.has(q.questionId)) {
          questionMap.set(q.questionId, { label, answers: [] });
        }
  
        const entry = questionMap.get(q.questionId)!;
  
        entry.answers.push({
          inspectionId: inspection.id,
          date: inspection.inspectdate ?? '',
          displayDate: inspection.inspectdate ? new Date(inspection.inspectdate).toLocaleDateString() : 'N/A',
          answer: answerText || q.questionText,
        });
      });
    });
  
    const result: QuestionComparison[] = Array.from(
      questionMap.entries()
    ).map(([questionId, { label, answers }]) => {
      const sortedAnswers = answers.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return {
        questionId,
        questionText: label || questionId,
        answers: sortedAnswers,
      };
    });
  
    return result.sort((a, b) => {
      const numA = parseInt(a.questionId.replace("Q", ""));
      const numB = parseInt(b.questionId.replace("Q", ""));
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      return numA - numB;
    });
  }, [inspections]);

  const formatAgeBadge = (days: number): string => {
    if (!days || days < 0) return 'New';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}yr ago`;
  };

  const toggleInspection = (id: number) => {
    setExpandedInspections(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.has(questionId) ? newSet.delete(questionId) : newSet.add(questionId);
      return newSet;
    });
  };

  // Handle opening the edit modal - goes straight to edit mode
  const handleOpenEditModal = (inspection: InspectionDetail) => {
    console.log('Opening edit modal for inspection:', inspection);
    console.log('inspection_id:', inspection.inspection_id);
    console.log('steward_id:', inspection.steward_id);
    console.log('notes_row_mapping:', inspection.notes_row_mapping);
    setSelectedInspection(inspection);
    setEditedInspection({ ...inspection });
    setIsEditing(true); // Go straight to edit mode
  };

  // Handle field updates - matches app's updateField pattern
  const updateField = useCallback((field: string, value: string) => {
    setEditedInspection(prev => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  }, []);

  const handleStewardChange = useCallback((value: string) => updateField('steward', value), [updateField]);
  const handleStewardGuestChange = useCallback((value: string) => updateField('steward_guest', value), [updateField]);
  const handleNaturalnessScoreChange = useCallback((value: string) => updateField('naturalness_score', value), [updateField]);
  const handleNaturalnessDetailsChange = useCallback((value: string) => updateField('naturalness_details', value), [updateField]);

  // Handle observation changes - matches app's handleObservationChange
  const handleObservationChange = useCallback((index: number, label: string, text: string) => {
    setEditedInspection(prev => {
      if (!prev) return null;
      const currentObs = prev.notes?.split('; ').map(o => o.trim()).filter(o => o.length > 0) || [];
      currentObs[index] = `${label}: ${text}`;
      return { ...prev, notes: currentObs.join('; ') };
    });
  }, []);

  // Handle save - uses real API call to Supabase
  const handleSaveInspection = async () => {
    if (!editedInspection) return;

    setIsSaving(true);
    try {
      // Call the actual Supabase update function
      await updateInspectionOnline(editedInspection);

      // Update local state
      setInspections(prev =>
        prev.map(insp =>
          insp.id === editedInspection.id ? editedInspection : insp
        )
      );

      setSelectedInspection(null);
      setIsEditing(false);
      setEditedInspection(null);

      // Could add a toast notification here
      console.log('Successfully saved inspection');
    } catch (err: any) {
      console.error('Error saving inspection:', err);
      alert(`Failed to save changes: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle modal dismiss - matches app's handleModalDismiss
  const handleModalDismiss = useCallback(() => {
    setSelectedInspection(null);
    setIsEditing(false);
    setEditedInspection(null);
  }, []);

  // Handle delete - opens confirmation modal
  const handleDeleteFromMenu = (inspectionId: number) => {
    setDeleteConfirm({ id: inspectionId, open: true });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      // Find the inspection to get the inspection_id
      const inspectionToDelete = inspections.find(ins => ins.id === deleteConfirm.id);
      if (inspectionToDelete?.inspection_id) {
        // Call the actual Supabase delete function
        await deleteSiteReportOnline(inspectionToDelete.inspection_id);
      }

      setInspections(prev => prev.filter(ins => ins.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      setSelectedInspection(null);
      setIsEditing(false);
      setEditedInspection(null);
      
      console.log('Successfully deleted inspection');
    } catch (err: any) {
      console.error('Error deleting inspection:', err);
      alert(`Failed to delete inspection: ${err.message}`);
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      const headers = ['Date', 'Score', 'Steward', 'County', 'Naturalness Details', 'Notes'];
      const rows = inspections.map(insp => [
        insp.inspectdate || '',
        insp.naturalness_score || '',
        (insp as any).steward || '',
        insp.county || '',
        insp.naturalness_details || '',
        insp.notes || ''
      ]);
      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${namesite}-inspections.csv`;
      a.click();
    } else {
      const json = JSON.stringify({ site, inspections }, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${namesite}-inspections.json`;
      a.click();
    }
    setShowExportMenu(false);
  };

  const getDataQualityScore = (inspection: InspectionDetail): { score: number; issues: string[] } => {
    const issues: string[] = [];
    let score = 100;

    if (!inspection.inspectdate) {
      issues.push('Missing inspection date');
      score -= 20;
    }
    if (!inspection.naturalness_score || inspection.naturalness_score.trim() === '') {
      issues.push('Missing naturalness score');
      score -= 25;
    }
    if (!inspection.notes || inspection.notes.trim() === '') {
      issues.push('Missing notes/observations');
      score -= 15;
    }
    if (!inspection.naturalness_details || inspection.naturalness_details.trim() === '') {
      issues.push('Missing naturalness details');
      score -= 10;
    }
    if (!inspection.county) {
      issues.push('Missing county');
      score -= 5;
    }

    return { score: Math.max(0, score), issues };
  };

  const filteredInspections = useMemo(() => {
    if (!filterText.trim()) return inspections;
    const lower = filterText.toLowerCase();
    return inspections.filter(insp => {
      return (
        (insp.inspectdate?.toLowerCase().includes(lower)) ||
        (insp.naturalness_score?.toLowerCase().includes(lower)) ||
        (insp.notes?.toLowerCase().includes(lower)) ||
        (insp.naturalness_details?.toLowerCase().includes(lower)) ||
        (insp.county?.toLowerCase().includes(lower))
      );
    });
  }, [inspections, filterText]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-[#E4EBE4] border-t-[#356B43] rounded-full animate-spin"></div>
        <p className="text-[#7A8075] font-medium">Loading site details...</p>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#FEE2E2] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-[#B91C1C]" />
          </div>
          <h2 className="text-2xl font-bold text-[#254431] mb-2">Unable to Load Site</h2>
          <p className="text-[#7A8075] mb-6">{error || "Site not found"}</p>
          <button
            onClick={() => router.push('/admin/sites')}
            className="bg-gradient-to-r from-[#356B43] to-[#254431] text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all"
          >
            Back to Admin Sites
          </button>
        </div>
      </div>
    );
  }

  const age = daysSince(site.inspectdate ?? '1900-01-01');
  const ageText = formatAgeBadge(age);
  
  const gradientPosition = average ? ((average - 1) / 3) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/admin/sites')}
            className="flex items-center gap-2 text-[#E4EBE4] hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Admin Sites</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                 <Image 
                src="/images/sapaa-icon-white.png" 
                alt="SAPAA"
                width={48}
                height={48}
                className="w-12 h-12 flex-shrink-0"
              />
                <h1 className="text-3xl font-bold">{site.namesite}</h1>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-semibold flex items-center gap-1">
                  <Settings className="w-4 h-4" />
                  Admin View
                </span>
              </div>
              
              {site.county && (
                <div className="flex items-center gap-2 text-[#E4EBE4] mb-2">
                  <MapPin className="w-5 h-5" />
                  <span className="text-lg">{site.county}</span>
                </div>
              )}

              {site.inspectdate && (
                <div className="flex items-center gap-2 text-[#E4EBE4]">
                  <Calendar className="w-5 h-5" />
                  <span>Last Inspection: {new Date(site.inspectdate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30">
                <div className="text-sm text-[#E4EBE4]">Last Visit</div>
                <div className="text-xl font-bold">{ageText}</div>
              </div>
              
              {/* Admin Actions */}
              <div className="relative export-menu-container">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 hover:bg-white/30 transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Export</span>
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border-2 border-[#E4EBE4] overflow-hidden z-10">
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full text-left px-4 py-3 hover:bg-[#F7F2EA] text-[#1E2520] transition-colors border-b border-[#E4EBE4] flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Export as CSV
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full text-left px-4 py-3 hover:bg-[#F7F2EA] text-[#1E2520] transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Export as JSON
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Admin Tools Bar */}
        <div className="bg-white rounded-2xl p-4 border-2 border-[#E4EBE4] shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => router.push(`/detail/${namesite}`)}
              className="px-4 py-2 bg-[#F7F2EA] hover:bg-[#E4EBE4] rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-[#254431]"
            >
              <Eye className="w-4 h-4" />
              View as User
            </button>
            <button
              onClick={() => setShowDataQuality(!showDataQuality)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                showDataQuality 
                  ? 'bg-[#356B43] text-white' 
                  : 'bg-[#F7F2EA] hover:bg-[#E4EBE4] text-[#254431]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Data Quality
            </button>
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#254431]" />
                <input
                  type="text"
                  placeholder="Filter inspections..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-[#86A98A] rounded-lg text-sm text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-[#356B43] shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Data Quality Panel */}
        {showDataQuality && (
          <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
            <h3 className="text-lg font-bold text-[#254431] mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#356B43]" />
              Data Quality Analysis
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {inspections.map((insp, idx) => {
                const quality = getDataQualityScore(insp);
                return (
                  <div key={idx} className="border-2 border-[#E4EBE4] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#7A8075]">
                        {insp.inspectdate ? new Date(insp.inspectdate).toLocaleDateString() : 'No Date'}
                      </span>
                      <span className={`text-sm font-bold ${
                        quality.score >= 80 ? 'text-[#1C7C4D]' :
                        quality.score >= 60 ? 'text-[#E0A63A]' :
                        'text-[#B91C1C]'
                      }`}>
                        {quality.score}%
                      </span>
                    </div>
                    {quality.issues.length > 0 && (
                      <div className="space-y-1">
                        {quality.issues.map((issue, i) => (
                          <div key={i} className="flex items-center gap-1 text-xs text-[#7A8075]">
                            <AlertTriangle className="w-3 h-3 text-[#E0A63A]" />
                            {issue}
                          </div>
                        ))}
                      </div>
                    )}
                    {quality.issues.length === 0 && (
                      <div className="flex items-center gap-1 text-xs text-[#1C7C4D]">
                        <CheckCircle2 className="w-3 h-3" />
                        All data present
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#E4EBE4] rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-[#356B43]" />
              </div>
              <div className="text-sm font-medium text-[#7A8075] uppercase tracking-wide">Total Reports</div>
            </div>
            <div className="text-3xl font-bold text-[#254431]">{inspections.length}</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#E4EBE4] rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-[#356B43]" />
              </div>
              <div className="text-sm font-medium text-[#7A8075] uppercase tracking-wide">Avg. Score</div>
            </div>
            <div className="text-3xl font-bold text-[#254431]">{average !== null ? average.toFixed(1) : 'N/A'}</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#E4EBE4] rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#356B43]" />
              </div>
              <div className="text-sm font-medium text-[#7A8075] uppercase tracking-wide">Condition</div>
            </div>
            <div className="text-2xl font-bold text-[#254431]">{avgText}</div>
          </div>
        </div>

        {/* Naturalness Score Gradient */}
        {average !== null && (
          <div className="bg-white rounded-2xl p-8 border-2 border-[#E4EBE4] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#254431] mb-1">Naturalness Score</h2>
                <p className="text-[#7A8075]">Average across all inspections</p>
              </div>
              <div className="text-5xl font-bold text-[#356B43]">{average.toFixed(1)}</div>
            </div>

            <div className="relative mb-4">
              <div className="h-8 rounded-full overflow-hidden bg-gradient-to-r from-[#B91C1C] via-[#E0A63A] via-[#84CC16] to-[#1C7C4D] shadow-inner"></div>
              
              <div 
                className="absolute top-0 transition-all duration-500"
                style={{ left: `${gradientPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="flex flex-col items-center">
                  <div className="w-1 h-8 bg-[#254431] rounded-full shadow-lg"></div>
                  <div className="w-4 h-4 bg-[#254431] rounded-full shadow-lg -mt-2 border-4 border-white"></div>
                </div>
              </div>
            </div>

            <div className="flex justify-between text-sm font-medium text-[#7A8075] px-1">
              <span>1.0 Poor</span>
              <span>2.0 Fair</span>
              <span>3.0 Good</span>
              <span>4.0 Excellent</span>
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex gap-2 bg-white rounded-2xl p-2 border-2 border-[#E4EBE4] shadow-sm">
          <button
            onClick={() => setViewMode('by-date')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
              viewMode === 'by-date'
                ? 'bg-gradient-to-r from-[#356B43] to-[#254431] text-white shadow-md'
                : 'text-[#7A8075] hover:bg-[#F7F2EA]'
            }`}
          >
            <Calendar className="w-5 h-5" />
            View by Date
          </button>
          <button
            onClick={() => setViewMode('by-question')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
              viewMode === 'by-question'
                ? 'bg-gradient-to-r from-[#356B43] to-[#254431] text-white shadow-md'
                : 'text-[#7A8075] hover:bg-[#F7F2EA]'
            }`}
          >
            <FileText className="w-5 h-5" />
            Compare by Question
          </button>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'by-date' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#254431] flex items-center gap-2">
                <FileText className="w-6 h-6 text-[#356B43]" />
                Inspection Reports ({filteredInspections.length}{filterText ? ` of ${inspections.length}` : ''})
              </h2>
            </div>
            
            {filteredInspections.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border-2 border-[#E4EBE4]">
                <Search className="w-12 h-12 text-[#7A8075] mx-auto mb-4" />
                <p className="text-[#7A8075] font-medium">No inspections match your filter</p>
              </div>
            ) : (
              filteredInspections.map((inspection) => {
              const isExpanded = expandedInspections.has(inspection.id);
              const questions = parseQuestions(inspection.notes);
              const quality = getDataQualityScore(inspection);
              
              return (
                <div key={inspection.id} className="bg-white rounded-2xl border-2 border-[#E4EBE4] shadow-sm hover:shadow-md transition-all relative">
                  <div className="flex items-center justify-between p-6">
                    <button
                      onClick={() => toggleInspection(inspection.id)}
                      className="flex-1 flex items-center justify-between text-left hover:bg-[#F7F2EA] transition-colors -m-6 p-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#E4EBE4] rounded-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-[#356B43]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-[#254431]">
                              {inspection.inspectdate ? new Date(inspection.inspectdate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              }) : 'No Date'}
                            </h3>
                            {quality.score < 80 && (
                              <div title={`Data quality: ${quality.score}%`}>
                                <AlertTriangle className="w-4 h-4 text-[#E0A63A]" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-[#7A8075]">Score: {normalizeScore(inspection.naturalness_score)}</p>
                        </div>
                      </div>
                      
                      
                      <div className="relative flex items-center gap-2">
                        {/* Chevron */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleInspection(inspection.id); }}
                          className="flex items-center justify-center w-8 h-8 rounded hover:bg-[#F7F2EA] transition-colors"
                        >
                          {expandedInspections.has(inspection.id) ? (
                            <ChevronUp className="w-6 h-6 text-[#7A8075]" />
                          ) : (
                            <ChevronDown className="w-6 h-6 text-[#7A8075]" />
                          )}
                        </button>

                        {/* Menu button */}
                        <div className="relative" ref={el => { menuRefs.current[inspection.id] = el as any; }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(prev => prev === inspection.id ? null : inspection.id);
                            }}
                            className="flex items-center justify-center w-8 h-8 rounded hover:bg-[#F7F2EA] transition-colors z-10"
                          >
                            <MoreVertical className="w-5 h-5 text-[#7A8075]" />
                          </button>

                          {openMenuId === inspection.id && (
                            <div
                              className="absolute right-0 top-full mt-2 w-32 max-w-[90vw] bg-white rounded-xl shadow-lg border border-[#E4EBE4] z-50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  handleOpenEditModal(inspection);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-[#F7F2EA] flex items-center gap-2 text-[#1E2520] rounded-t-xl"
                              >
                                <Edit3 className="w-4 h-4" /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteFromMenu(inspection.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-[#FEE2E2] flex items-center gap-2 text-[#B91C1C] rounded-b-xl"
                              >
                                <X className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          )}

                        </div>

                      </div>


                    </button>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-4 border-t-2 border-[#E4EBE4] pt-4">
                      {(inspection as any).steward && (
                        <div>
                          <p className="text-sm font-semibold text-[#7A8075] mb-1">Steward</p>
                          <p className="text-[#1E2520]">{(inspection as any).steward}</p>
                        </div>
                      )}
                      
                      {inspection.naturalness_details && (
                        <div>
                          <p className="text-sm font-semibold text-[#7A8075] mb-1">Naturalness Details</p>
                          <p className="text-[#1E2520]">{inspection.naturalness_details}</p>
                        </div>
                      )}

                      {questions.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-[#7A8075] mb-2">Observations</p>
                          <div className="space-y-2">
                            {questions.map((q, idx) => (
                              <div key={idx} className="bg-[#F7F2EA] rounded-lg p-3">
                                <span className="font-semibold text-[#356B43]">{q.questionId}:</span>{' '}
                                <span className="text-[#1E2520]">{q.questionText}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Data Quality Info */}
                      {quality.issues.length > 0 && (
                        <div className="border-t-2 border-[#E4EBE4] pt-4 mt-4">
                          <p className="text-sm font-semibold text-[#7A8075] mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-[#E0A63A]" />
                            Data Quality: {quality.score}%
                          </p>
                          <div className="space-y-1">
                            {quality.issues.map((issue, i) => (
                              <div key={i} className="text-xs text-[#7A8075] bg-[#FEF3C7] rounded px-2 py-1">
                                {issue}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#254431] flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#356B43]" />
              Question Comparison ({questionComparisons.length} questions)
            </h2>

            {questionComparisons.map((qComp) => {
              const isExpanded = expandedQuestions.has(qComp.questionId);
              
              return (
                <div key={qComp.questionId} className="bg-white rounded-2xl border-2 border-[#E4EBE4] overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <button
                    onClick={() => toggleQuestion(qComp.questionId)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-[#F7F2EA] transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-[#E4EBE4] rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-[#356B43]">{qComp.questionId}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#1E2520] font-medium">{qComp.questionText}</p>
                        <p className="text-sm text-[#7A8075] mt-1">{qComp.answers.length} response{qComp.answers.length !== 1 ? 's' : ''} across inspections</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-6 h-6 text-[#7A8075] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-[#7A8075] flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-3 border-t-2 border-[#E4EBE4] pt-4">
                      {qComp.answers.map((answer, idx) => (
                        <div key={`${answer.inspectionId}-${idx}`} className="bg-[#F7F2EA] rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-[#7A8075]" />
                            <span className="text-sm font-semibold text-[#356B43]">
                              {answer.displayDate}
                            </span>
                          </div>
                          <p className="text-[#1E2520]">{answer.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Inspection Modal - Goes straight to edit mode */}
      {selectedInspection && editedInspection && (
        <div className="fixed inset-0 bg-[#254431]/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b-2 border-[#E4EBE4] flex-shrink-0">
              <h2 className="text-2xl font-bold text-[#254431]">
                Edit Report: {editedInspection.inspectdate ? new Date(editedInspection.inspectdate).toLocaleDateString() : 'No Date'}
              </h2>
              {/* Close Button */}
              <button
                onClick={handleModalDismiss}
                disabled={isSaving}
                className="w-10 h-10 rounded-xl hover:bg-[#E4EBE4] flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6 text-[#7A8075]" />
              </button>
            </div>

            {/* Modal Content - Edit Form */}
            <div className="p-6 overflow-y-auto flex-1 relative">
              {/* Saving Overlay */}
              {isSaving && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10 rounded-b-3xl">
                  <Loader2 className="w-12 h-12 text-[#356B43] animate-spin mb-4" />
                  <p className="text-[#356B43] font-medium text-lg">Saving changes...</p>
                </div>
              )}

              {/* Edit Form Fields */}
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-[#254431] mb-6">
                  Inspection {editedInspection.inspectno || editedInspection.id}
                </h1>

                <EditableField
                  label="Steward"
                  value={editedInspection.steward || ''}
                  onChange={handleStewardChange}
                  placeholder="Enter steward name"
                />

                <EditableField
                  label="Steward Guest"
                  value={editedInspection.steward_guest || ''}
                  onChange={handleStewardGuestChange}
                  placeholder="Enter steward guest"
                />

                <EditableField
                  label="Naturalness Score"
                  value={editedInspection.naturalness_score || ''}
                  onChange={handleNaturalnessScoreChange}
                  placeholder="Enter naturalness score (e.g., 3.5)"
                />

                <EditableField
                  label="Naturalness Details"
                  value={editedInspection.naturalness_details || ''}
                  onChange={handleNaturalnessDetailsChange}
                  placeholder="Enter naturalness details"
                  multiline
                />

                {/* Observations Section */}
                <div>
                  <label className="block text-sm font-semibold text-[#254431] mb-3">
                    Observations
                  </label>
                  <div className="space-y-2">
                    {(() => {
                      const observations = parseObservations(editedInspection.notes || null);
                      
                      if (observations.length === 0) {
                        return (
                          <div className="text-[#7A8075] text-sm italic bg-[#F7F2EA] rounded-lg p-4">
                            No observations recorded
                          </div>
                        );
                      }

                      return observations.map((obs, index) => {
                        // Check if it's a Q# type observation
                        const isQuestion = obs.label.match(/^Q\d+/);
                        
                        if (isQuestion) {
                          return (
                            <ObservationField
                              key={`obs-${obs.label}-${index}`}
                              label={obs.label}
                              content={obs.content}
                              index={obs.originalIndex}
                              onChange={handleObservationChange}
                            />
                          );
                        } else {
                          // Non-question observation (plain text)
                          return (
                            <div key={`text-${index}`} className="bg-[#F7F2EA] rounded-lg p-3">
                              <span className="text-[#7A8075] text-sm">• {obs.content}</span>
                            </div>
                          );
                        }
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer with Save/Cancel buttons */}
            <div className="p-4 border-t-2 border-[#E4EBE4] flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={handleModalDismiss}
                className="px-4 py-2 rounded-xl border-2 border-[#E4EBE4] text-[#7A8075] hover:bg-[#F7F2EA] font-medium transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInspection}
                disabled={isSaving}
                className="px-6 py-2 bg-[#356B43] text-white rounded-xl font-semibold hover:bg-[#254431] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm?.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4">
            <div className="w-12 h-12 bg-[#FEE2E2] rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-[#B91C1C]" />
            </div>
            <h3 className="text-lg font-bold text-[#254431] text-center mb-2">Delete Inspection?</h3>
            <p className="text-[#7A8075] text-center mb-6">
              Are you sure you want to delete this inspection? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                className="px-5 py-2.5 rounded-xl border-2 border-[#E4EBE4] text-[#7A8075] hover:bg-[#F7F2EA] font-medium transition-colors"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2.5 bg-[#B91C1C] text-white rounded-xl font-semibold hover:bg-[#991B1B] transition-colors"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}