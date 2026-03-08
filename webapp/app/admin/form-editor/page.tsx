"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Save,
  X,
  Loader2,
  Eye,
  EyeOff,
  FileText,
  Type,
  List,
  CheckSquare,
  Image as ImageIcon,
  Calendar,
  FileCheck,
  AlertCircle,  
} from "lucide-react";
import Image from "next/image";
import {
  DndContext,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import AdminNavBar from "../AdminNavBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  fetchFormSections,
  fetchFormQuestions,
  saveQuestion,
  toggleQuestionActive,
  addQuestion,
  reorderQuestions,
  addFormSection,
  type FormSection,
  type FormQuestion,
  type QuestionOption,
} from "@/utils/form-actions";

const QUESTION_TYPES = [
  { value: "option", label: "Radio", icon: List },
  { value: "selectall", label: "Checkbox", icon: CheckSquare },
  { value: "text", label: "Text", icon: Type },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "date", label: "Date", icon: Calendar },
];

function getTypeIcon(type: string) {
  const found = QUESTION_TYPES.find((t) => t.value === type.trim());
  return found?.icon ?? FileText;
}

function getTypeLabel(type: string) {
  const found = QUESTION_TYPES.find((t) => t.value === type.trim());
  return found?.label ?? type;
}

// ─── Main Page Component ─────────────────────────────────────────────
export default function FormEditorPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<FormSection[]>([]);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<FormQuestion | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<FormQuestion | null>(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionDescription, setNewSectionDescription] = useState("");
  const [newSectionHeader, setNewSectionHeader] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const handleUpdatePreview = useCallback((draft: Partial<FormQuestion>) => {
  setSelectedQuestion(draft as FormQuestion);}, []);

  // ─── Data Fetching ───────────────────────────────────────────────
  const loadSections = useCallback(async () => {
    try {
      const data = await fetchFormSections();
      setSections(data);
      if (data.length > 0 && activeSection === null) {
        setActiveSection(data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [activeSection]);

  const loadQuestions = useCallback(async () => {
    try {
      const data = await fetchFormQuestions();
      setQuestions(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([loadSections(), loadQuestions()]);
      setLoading(false);
    }
    loadData();
  }, [loadSections, loadQuestions]);

  // ─── Derived State ───────────────────────────────────────────────
  const currentQuestions = questions
    .filter((q) => q.section_id === activeSection)
    .sort((a, b) => (a.formorder ?? 0) - (b.formorder ?? 0));

  const currentSection = sections.find((s) => s.id === activeSection);

  // ─── Question CRUD ───────────────────────────────────────────────
  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSaveQuestion = async (question: FormQuestion) => {
    setSaving(true);
    setError(null);
    try {
      if (question.subtext == '') {
        question.subtext = null;
      }
      await saveQuestion(question);
      await loadQuestions();
      setEditingQuestion(null);
      showSuccess("Question saved successfully");
    } catch (err: any) {
      setError("Failed to save question: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      // Optimistic Update
      setQuestions(prev => 
        prev.map(q => q.id === id ? { ...q, is_active: !currentStatus } : q)
      );
      
      await toggleQuestionActive(id, currentStatus);
    } catch (err) {
      // Revert on error
      loadQuestions(); 
      alert("Could not update question status.");
    }
  };

  const handleAddQuestion = async (newQuestion: {
    form_question: string;
    subtext: string;
    question_type: string;
    is_required: boolean;
    options: string[];
    question_key: string;
  }) => {
    if (!activeSection) return;
    setSaving(true);
    setError(null);
    try {
      await addQuestion(activeSection, newQuestion);
      await loadQuestions();
      setShowAddQuestion(false);
      showSuccess("Question added successfully");
    } catch (err: any) {
      setError("Failed to add question: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Drag-and-Drop ─────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const overId = String(over.id);
    if (overId.startsWith("section-")) return;

    const oldIndex = currentQuestions.findIndex((q) => q.id === active.id);
    const newIndex = currentQuestions.findIndex((q) => q.id === over.id);

    if (oldIndex < 0 || newIndex < 0) return;

    const reorderedSectionQuestions = arrayMove(currentQuestions, oldIndex, newIndex);

    const reorderedSectionIds = reorderedSectionQuestions.map((q) => q.id);
    const reorderedSectionMap = new Map(
      reorderedSectionQuestions.map((q) => [q.id, q])
    );

    let sectionInsertIndex = 0;
    const mergedQuestions = questions.map((q) => {
      if (q.section_id !== activeSection) return q;

      const replacement = reorderedSectionMap.get(reorderedSectionIds[sectionInsertIndex]);
      sectionInsertIndex++;
      return replacement ?? q;
    });

    const globallyOrderedQuestions = mergedQuestions.map((q, index) => ({
      ...q,
      formorder: index + 1,
    }));

    const prevQuestions = [...questions];
    setQuestions(globallyOrderedQuestions);

    try {
      const updates = globallyOrderedQuestions.map((q) => ({
        questionId: q.id,
        questionName: q.form_question,
        newOrder: q.formorder as number,
      }));

      await reorderQuestions(updates);
    } catch (err: any) {
      setQuestions(prevQuestions);
      setError("Failed to reorder: " + err.message);
    }
  };

  // ─── Section CRUD ────────────────────────────────────────────────
  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const newId = await addFormSection({
        title: newSectionTitle.trim(),
        description: newSectionDescription.trim() || null,
        header: newSectionHeader.trim() || newSectionTitle.trim(),
      });
      await loadSections();
      setActiveSection(newId);
      setShowAddSection(false);
      setNewSectionTitle("");
      setNewSectionDescription("");
      setNewSectionHeader("");
      showSuccess("Section added successfully");
    } catch (err: any) {
      setError("Failed to add section: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading State ───────────────────────────────────────────────
  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-[#356B43] animate-spin" />
          <p className="text-[#7A8075] font-medium">Loading form editor...</p>
        </div>
      </ProtectedRoute>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <ProtectedRoute requireAdmin>
    <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA]">
      <div className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              {/* Left: icon + title + subtitle */}
              <div className="flex items-center gap-4">
                <Image
                  src="/images/sapaa-icon-white.png"
                  alt="SAPAA"
                  width={140}
                  height={140}
                  priority
                  className="h-16 w-auto flex-shrink-0 opacity-100 mt-1"
                />
                <div>
                  <h1 className="text-3xl font-bold mt-3">Form Editor</h1>
                  <p className="text-[#E4EBE4] text-base mt-0.5">
                    Manage inspection form sections and questions
                  </p>
                </div>
              </div>
              {/* Right: navbar — rendered inline, bg overridden to transparent */}
              <div className="[&>nav]:bg-none [&>nav]:bg-transparent [&>nav]:shadow-none [&>nav]:px-0 [&>nav]:py-0">
                <AdminNavBar />
              </div>
            </div>
          </div>
        </div>


        {/* Alerts */}
        {error && (
          <div className="max-w-7xl mx-auto px-6 pt-4">
            <div className="bg-[#FEE2E2] border-2 border-[#FECACA] text-[#B91C1C] px-4 py-3 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {successMessage && (
          <div className="max-w-7xl mx-auto px-6 pt-4">
            <div className="bg-[#DCFCE7] border-2 border-[#BBF7D0] text-[#166534] px-4 py-3 rounded-xl flex items-center gap-3">
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Main Layout */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragEnd={handleDragEnd}
          >
          <div className="flex gap-8 min-h-[calc(100vh-260px)]">
            {/* ── Sidebar: Sections ── */}
            <div className="w-[220px] flex-shrink-0">
              <div className="bg-white rounded-2xl border-2 border-[#E4EBE4] p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#254431] uppercase tracking-wide">
                    Sections
                  </h3>
                  <button
                    onClick={() => setShowAddSection(true)}
                    className="w-7 h-7 bg-[#E4EBE4] hover:bg-[#356B43] hover:text-white text-[#356B43] rounded-lg flex items-center justify-center transition-all"
                    title="Add Section"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {sections.map((section) => {
                    const count = questions.filter(
                      (q) => q.section_id === section.id
                    ).length;
                    return (
                      <DroppableSectionButton
                        key={section.id}
                        data-testid={`section-button-${section.id}`}
                        section={section}
                        count={count}
                        isActive={activeSection === section.id}
                        onClick={() => {
                          setActiveSection(section.id);
                          setSelectedQuestion(null);
                          setEditingQuestion(null);
                          setShowAddQuestion(false);
                        }}
                      />
                    );
                  })}
                </div>

                {/* Add Section Modal */}
                {showAddSection && (
                  <div className="mt-4 p-3 bg-[#F7F2EA] rounded-xl border-2 border-[#E4EBE4]">
                    <h4 className="text-xs font-bold text-[#254431] uppercase mb-2">
                      New Section
                    </h4>
                    <input
                      type="text"
                      placeholder="Section title"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm border-2 border-[#E4EBE4] rounded-lg mb-2 focus:outline-none focus:border-[#356B43]"
                    />
                    <input
                      type="text"
                      placeholder="Sidebar label (optional)"
                      value={newSectionHeader}
                      onChange={(e) => setNewSectionHeader(e.target.value)}
                      className="w-full px-3 py-2 text-sm border-2 border-[#E4EBE4] rounded-lg mb-2 focus:outline-none focus:border-[#356B43]"
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={newSectionDescription}
                      onChange={(e) =>
                        setNewSectionDescription(e.target.value)
                      }
                      rows={2}
                      className="w-full px-3 py-2 text-sm border-2 border-[#E4EBE4] rounded-lg mb-3 focus:outline-none focus:border-[#356B43] resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddSection}
                        disabled={saving || !newSectionTitle.trim()}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-[#356B43] to-[#254431] text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-all"
                      >
                        {saving ? "Adding..." : "Add"}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddSection(false);
                          setNewSectionTitle("");
                          setNewSectionDescription("");
                          setNewSectionHeader("");
                        }}
                        className="px-3 py-2 border-2 border-[#E4EBE4] text-[#7A8075] text-xs font-semibold rounded-lg hover:bg-[#E4EBE4] transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Center: Question List + Editor ── */}
            <div className="flex-1 min-w-0">
              {/* Section Header + Toolbar */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#254431]">
                    {currentSection?.title ?? "Select a section"}
                  </h2>
                  {currentSection?.description && (
                    <p className="text-sm text-[#7A8075] mt-1">
                      {currentSection.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowAddQuestion(true);
                      setEditingQuestion(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#356B43] to-[#254431] text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>
              </div>

              {/* Type Filter Chips */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {QUESTION_TYPES.map((type) => {
                  const Icon = type.icon;
                  const count = currentQuestions.filter(
                    (q) => q.question_type.trim() === type.value
                  ).length;
                  return (
                    <div
                      key={type.value}
                      className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#E4EBE4] rounded-lg text-xs font-medium text-[#7A8075] bg-white"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {type.label}
                      {count > 0 && (
                        <span className="bg-[#E4EBE4] text-[#254431] px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                          {count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Question Form */}
              {showAddQuestion && (
                <AddQuestionForm
                  sectionId={activeSection!}
                  saving={saving}
                  onSave={handleAddQuestion}
                  onCancel={() => {
                    setShowAddQuestion(false);
                    setSelectedQuestion(null); // Clear preview on cancel
                  }}
                  // Update the preview panel as the user types
                  onUpdate={handleUpdatePreview}
                />
              )}

              {/* Questions List */}
              {currentQuestions.length === 0 && !showAddQuestion ? (
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-[#E4EBE4]">
                  <FileText className="w-12 h-12 text-[#E4EBE4] mx-auto mb-3" />
                  <p className="text-[#7A8075] font-medium">
                    No questions in this section yet.
                  </p>
                  <button
                    onClick={() => setShowAddQuestion(true)}
                    className="mt-4 text-sm text-[#356B43] font-semibold hover:underline"
                  >
                    + Add a question
                  </button>
                </div>
              ) : (
                <SortableContext
                  items={currentQuestions.map((q) => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {currentQuestions.map((question) => (
                      <SortableQuestionCard
                        key={question.id}
                        data-testid={`question-card-${question.id}`}
                        question={question}
                        isSelected={selectedQuestion?.id === question.id}
                        isEditing={editingQuestion?.id === question.id}
                        saving={saving}
                        onSelect={() => setSelectedQuestion(question)}
                        onEdit={() => {
                          setSelectedQuestion(question);
                          setEditingQuestion({ ...question });
                          setShowAddQuestion(false);
                        }}
                        onToggleActive={() => handleToggleActive(question.id, question.is_active)}
                        onSave={handleSaveQuestion}
                        onCancelEdit={() => setEditingQuestion(null)}
                        editingQuestion={
                          editingQuestion?.id === question.id
                            ? editingQuestion
                            : null
                        }
                        onEditingChange={setEditingQuestion}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </div>

            {/* ── Right: Preview Panel ── */}
            <div className="w-[340px] flex-shrink-0 hidden lg:block">
              <div className="bg-[#F7F2EA] rounded-2xl border-2 border-[#E4EBE4] p-5 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-[#7A8075] uppercase tracking-wider">
                    Preview
                  </h3>
                  {/* Badge to show user they are looking at the 'Add Question' draft */}
                  {selectedQuestion?.id === -1 && (
                    <span className="text-[10px] bg-[#356B43] text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                      LIVE DRAFT
                    </span>
                  )}
                </div>

                {selectedQuestion ? (
                  <PreviewPanel question={selectedQuestion} />
                ) : (
                  <div className="text-center py-12">
                    <Eye className="w-10 h-10 text-[#E4EBE4] mx-auto mb-3" />
                    <p className="text-sm text-[#7A8075]">
                      Select a question or start adding one to see a preview
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          </DndContext>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// ─── DroppableSectionButton Component ────────────────────────────────
function DroppableSectionButton({
  section,
  count,
  isActive,
  onClick,
  "data-testid": dataTestId,
}: {
  section: FormSection;
  count: number;
  isActive: boolean;
  onClick: () => void;
  "data-testid"?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `section-${section.id}`,
  });

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      data-testid={dataTestId}
      className={`w-full text-left px-3 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
        isOver
          ? "bg-[#DCFCE7] text-[#166534] border-2 border-[#22C55E] scale-[1.03] shadow-md"
          : isActive
            ? "bg-[#EEF5EF] text-[#356B43] border-2 border-[#356B43]"
            : "text-[#7A8075] border-2 border-[#E4EBE4] hover:border-[#86A98A]"
      }`}
    >
      <span className="truncate">
        {section.header || section.title}
      </span>
      <span
        className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
          isOver
            ? "bg-[#22C55E] text-white"
            : isActive
              ? "bg-[#356B43] text-white"
              : "bg-[#E4EBE4] text-[#7A8075]"
        }`}
        data-testid={`section-count-${section.id}`}
      >
        {count}
      </span>
    </button>
  );
}

// ─── SortableQuestionCard Component ──────────────────────────────────
function SortableQuestionCard({
  question,
  isSelected,
  isEditing,
  saving,
  onSelect,
  onEdit,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  onSave,
  onCancelEdit,
  editingQuestion,
  onEditingChange,
}: {
  question: FormQuestion;
  isSelected: boolean;
  isEditing: boolean;
  saving: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onToggleActive: (id: number, currentStatus: boolean) => Promise<void>;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onSave: (q: FormQuestion) => void;
  onCancelEdit: () => void;
  editingQuestion: FormQuestion | null;
  onEditingChange: (q: FormQuestion | null) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const TypeIcon = getTypeIcon(question.question_type);

  if (isEditing && editingQuestion) {
    return (
      <div ref={setNodeRef} style={style}>
        <EditQuestionForm
          question={editingQuestion}
          saving={saving}
          onChange={onEditingChange}
          onSave={() => onSave(editingQuestion)}
          onCancel={onCancelEdit}
        />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`bg-white border-2 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all hover:shadow-sm ${
        isDragging ? "shadow-lg scale-[1.02]" : ""
      } ${
        isSelected
          ? "border-[#356B43] shadow-sm"
          : "border-[#E4EBE4] hover:border-[#86A98A]"
      } ${
        !question.is_active ? "opacity-60 bg-gray-50/50 border-dashed" : "" // Visual changes for hidden questions
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          {...attributes}
          {...listeners}
          className="touch-none flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-[#E4EBE4] transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-[#7A8075]" />
        </button>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            !question.is_active 
            ? "bg-gray-200 text-gray-500" // Dimmed icon background
            : isSelected
              ? "bg-[#356B43] text-white"
              : "bg-[#E4EBE4] text-[#356B43]"
          }`}
        >
          <TypeIcon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#254431] truncate">
            {question.form_question || "Untitled Question"}
          </p>
          {!question.is_active && (
            <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded-full font-bold uppercase tracking-tight">
              Hidden
            </span>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-[#7A8075]">
              {getTypeLabel(question.question_type)}
            </span>
            {question.is_required && (
              <span className="text-[10px] px-1.5 py-0.5 bg-[#FEE2E2] text-[#B91C1C] rounded-full font-semibold">
                Required
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#356B43] hover:bg-[#EEF5EF] transition-all"
          title="Edit"
          data-testid="edit-question-button"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleActive(question.id, question.is_active);
          }}
          className={`p-1.5 rounded-md transition-colors ${
            question.is_active 
              ? "text-[#7A8075] hover:text-[#254431] hover:bg-[#F7F2EA]" 
              : "text-amber-600 bg-amber-50 hover:bg-amber-100"
          }`}
          title={question.is_active ? "Hide Question" : "Show Question"}
          data-testid={question.is_active ? question.form_question + " Hide Button" : question.form_question + " Show Button"}
          >
          {question.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── EditQuestionForm Component ──────────────────────────────────────
function EditQuestionForm({
  question,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  question: FormQuestion;
  saving: boolean;
  onChange: (q: FormQuestion) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const needsOptions = ["option", "selectall"].includes(
    question.question_type.trim()
  );

  return (
    <div className="bg-white border-2 border-[#356B43] rounded-xl p-5 shadow-md">
      <h4 className="text-sm font-bold text-[#254431] mb-4">Edit Question</h4>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-[#7A8075] uppercase tracking-wide">
            Question Title
          </label>
          <input
            type="text"
            data-testid="edit-question-title"
            value={question.form_question || ""}
            onChange={(e) =>
              onChange({ ...question, form_question: e.target.value })
            }
            className="w-full mt-1 px-3 py-2.5 border-2 border-[#E4EBE4] rounded-xl text-sm focus:outline-none focus:border-[#356B43] transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7A8075] uppercase tracking-wide">
            Description / Subtext
          </label>
          <textarea
            data-testid="edit-question-subtext"
            value={question.subtext || ""}
            onChange={(e) =>
              onChange({ ...question, subtext: e.target.value })
            }
            rows={2}
            className="w-full mt-1 px-3 py-2.5 border-2 border-[#E4EBE4] rounded-xl text-sm focus:outline-none focus:border-[#356B43] resize-none transition-colors"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-[#7A8075] uppercase tracking-wide">
              Question Type
            </label>
            <div className="grid grid-cols-5 gap-2 opacity-60 cursor-not-allowed">
              {QUESTION_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = question.question_type === type.value;
                return (
                  <div
                    key={type.value}
                    className={`flex flex-col items-center gap-1 p-1 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-[#356B43] bg-[#356B43]/5 text-[#356B43]"
                        : "border-[#E4EBE4] text-[#7A8075]"
                    }`}
                  >
                    <Icon size={15} />
                    <span className="text-[10px] font-medium">{type.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 px-3 py-2.5 border-2 border-[#E4EBE4] rounded-xl cursor-pointer hover:border-[#86A98A] transition-colors">
              <input
                type="checkbox"
                checked={question.is_required}
                onChange={(e) =>
                  onChange({ ...question, is_required: e.target.checked })
                }
                className="w-4 h-4 text-[#356B43] rounded focus:ring-[#356B43]"
              />
              <span className="text-sm font-medium text-[#254431]">
                Required
              </span>
            </label>
          </div>
        </div>

        {/* Options Editor */}
        {needsOptions && (
          <div>
            <label className="text-xs font-semibold text-[#7A8075] uppercase tracking-wide">
              Options
            </label>
            <div className="mt-2 space-y-2">
              {question.options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt.option_text}
                    onChange={(e) => {
                      const newOpts = [...question.options];
                      newOpts[i] = { ...opt, option_text: e.target.value };
                      onChange({ ...question, options: newOpts });
                    }}
                    className="flex-1 px-3 py-2 border-2 border-[#E4EBE4] rounded-lg text-sm focus:outline-none focus:border-[#356B43] transition-colors"
                  />
                  <button
                    onClick={() => {
                      const newOpts = question.options.filter(
                        (_, idx) => idx !== i
                      );
                      onChange({ ...question, options: newOpts });
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#B91C1C] hover:bg-[#FEE2E2] transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  onChange({
                    ...question,
                    options: [
                      ...question.options,
                      { id: -Date.now(), option_text: "", is_active: true },
                    ],
                  })
                }
                className="text-sm text-[#356B43] font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add option
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-5 pt-4 border-t-2 border-[#E4EBE4]">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#356B43] to-[#254431] text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:shadow-lg transition-all"
          data-testid="save-question-button"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 border-2 border-[#E4EBE4] text-[#7A8075] text-sm font-semibold rounded-xl hover:bg-[#E4EBE4] transition-all"
          data-testid="cancel-button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── AddQuestionForm Component ───────────────────────────────────────
function AddQuestionForm({
  sectionId,
  saving,
  onSave,
  onCancel,
  onUpdate,
} : {
  sectionId: number;
  saving: boolean;
  onSave: (q: {
    form_question: string;
    subtext: string;
    question_type: string;
    is_required: boolean;
    options: string[];
    question_key: string;
  }) => void;
  onCancel: () => void;
  onUpdate: (q: Partial<FormQuestion>) => void; // New prop
}) {
  const [title, setTitle] = useState("");
  const [subtext, setSubtext] = useState("");
  const [type, setType] = useState("option");
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState(["", ""]);
  const [questionKey, setQuestionKey] = useState("");

  const needsOptions = ["option", "selectall"].includes(type);

  // Sync with preview panel whenever local state changes
  useEffect(() => {
  onUpdate({
    id: -1, // Temporary ID to mark as draft
    form_question: title || "Untitled Question", // Fallback for preview
    subtext,
    question_type: type,
    is_required: required,
    options: options.map((opt, i) => ({ 
      id: i, 
      option_text: opt || `Option ${i + 1}`, // Shows "Option 1" in preview if empty
      is_active: true 
    })),
    section_id: sectionId,
  });
}, [title, subtext, type, required, options, sectionId, onUpdate]);

  return (
    <div className="bg-white border-2 border-[#356B43] rounded-xl p-5 shadow-md mb-4">
      <h4 className="text-sm font-bold text-[#254431] mb-4">
        New Question
      </h4>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-[#7A8075] uppercase tracking-wide">
            Question Title
          </label>
          <input
            type="text"
            value={title}
            title="add-question-title"
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Must be in this format -> Question Test (Q70)"
            className="w-full mt-1 px-3 py-2.5 border-2 border-[#E4EBE4] rounded-xl text-sm focus:outline-none focus:border-[#356B43] transition-colors placeholder:text-[#7A8075]"
            data-testid="add-question-title"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7A8075] uppercase tracking-wide">
            Description / Subtext
          </label>
          <textarea
            value={subtext}
            title="add-question-subtext"
            onChange={(e) => setSubtext(e.target.value)}
            placeholder="Additional context for the question (optional)"
            rows={2}
            className="w-full mt-1 px-3 py-2.5 border-2 border-[#E4EBE4] rounded-xl text-sm focus:outline-none focus:border-[#356B43] resize-none transition-colors placeholder:text-[#7A8075]"
            data-testid="add-question-subtext"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7A8075] uppercase tracking-wide">
            Question Key
          </label>
          <input
            type="text"
            title="add-question-key"
            value={questionKey}
            onChange={(e) => setQuestionKey(e.target.value)}
            placeholder="Must be in this format -> Q70_QuestionTest"
            className="w-full mt-1 px-3 py-2.5 border-2 border-[#E4EBE4] rounded-xl text-sm focus:outline-none focus:border-[#356B43] transition-colors placeholder:text-[#7A8075]"
            data-testid="add-question-key"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-[#7A8075] uppercase tracking-wide">
              Type
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {QUESTION_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`flex items-center gap-1.5 px-3 py-2 border-2 rounded-lg text-xs font-medium transition-all ${
                      type === t.value
                        ? "border-[#356B43] bg-[#EEF5EF] text-[#356B43]"
                        : "border-[#E4EBE4] text-[#7A8075] hover:border-[#86A98A]"
                    }`}
                    data-testid={`question-type-${t.label}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="w-4 h-4 text-[#356B43] rounded focus:ring-[#356B43]"
          />
          <span className="text-sm font-medium text-[#254431]">
            Required question
          </span>
        </label>

        {/* Options */}
        {needsOptions && (
          <div>
            <label className="text-xs font-semibold text-[#7A8075] uppercase tracking-wide">
              Answer Options
            </label>
            <div className="mt-2 space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...options];
                      newOpts[i] = e.target.value;
                      setOptions(newOpts);
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 px-3 py-2 border-2 border-[#E4EBE4] rounded-lg text-sm focus:outline-none focus:border-[#356B43] transition-colors placeholder:text-[#7A8075]"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() =>
                        setOptions(options.filter((_, idx) => idx !== i))
                      }
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#B91C1C] hover:bg-[#FEE2E2] transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setOptions([...options, ""])}
                className="text-sm text-[#356B43] font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add option
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-5 pt-4 border-t-2 border-[#E4EBE4]">
        <button
          onClick={() =>
            onSave({
              form_question: title,
              subtext,
              question_type: type,
              is_required: required,
              options: needsOptions ? options.filter((o) => o.trim()) : [],
              question_key: questionKey.trim(),
            })
          }
          disabled={saving || !title.trim()}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#356B43] to-[#254431] text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:shadow-lg transition-all"
          data-testid="save-new-question"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add Question
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 border-2 border-[#E4EBE4] text-[#7A8075] text-sm font-semibold rounded-xl hover:bg-[#E4EBE4] transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── PreviewPanel Component ──────────────────────────────────────────
function PreviewPanel({ question }: { question: FormQuestion }) {
  const questionType = question.question_type.trim();

  return (
    <div className="bg-white rounded-xl border-2 border-[#E4EBE4] p-5">
      {/* Question Header */}
      <div className="flex items-start gap-3 mb-4">
        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#F7F2EA] text-[#356B43] flex items-center justify-center font-bold text-sm">
          Q
        </span>
        <div>
          <h4 className="font-bold text-[#254431] text-sm leading-tight">
            {question.form_question || "Untitled Question"}
          </h4>
          {question.subtext && (
            <p className="text-xs text-[#7A8075] mt-1">{question.subtext}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F7F2EA] text-[#7A8075] font-medium">
              {getTypeLabel(questionType)}
            </span>
            {question.is_required && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#B91C1C] font-semibold">
                Required
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Preview Body */}
      <div className="space-y-2">
        {questionType === "option" &&
          question.options.map((opt, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2.5 border-2 border-[#E4EBE4] rounded-xl text-sm text-[#254431]"
            >
              <div className="w-5 h-5 border-2 border-[#E4EBE4] rounded-full flex-shrink-0" />
              {opt.option_text}
            </div>
          ))}

        {questionType === "selectall" &&
          question.options.map((opt, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2.5 border-2 border-[#E4EBE4] rounded-xl text-sm text-[#254431]"
            >
              <div className="w-5 h-5 border-2 border-[#E4EBE4] rounded flex-shrink-0" />
              {opt.option_text}
            </div>
          ))}

        {(questionType === "text" || questionType === "text\n") && (
          <div className="w-full h-20 border-2 border-[#E4EBE4] rounded-xl bg-[#F7F2EA]/30 flex items-start p-3">
            <span className="text-xs text-[#7A8075]">
              Text response area...
            </span>
          </div>
        )}

        {questionType === "date" && (
          <div className="w-full px-3 py-2.5 border-2 border-[#E4EBE4] rounded-xl text-sm text-[#7A8075]">
            mm/dd/yyyy
          </div>
        )}

        {questionType === "image" && (
          <div className="border-2 border-dashed border-[#E4EBE4] rounded-xl p-6 text-center bg-[#F7F2EA]/30">
            <ImageIcon className="w-8 h-8 text-[#E4EBE4] mx-auto mb-2" />
            <p className="text-xs text-[#7A8075]">
              Drag and drop or click to upload
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
