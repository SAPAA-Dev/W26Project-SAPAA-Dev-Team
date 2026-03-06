"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
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

import AdminNavBar from "../AdminNavBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  fetchFormSections,
  fetchFormQuestions,
  saveQuestion,
  deleteQuestion,
  toggleQuestionActive,
  addQuestion,
  swapQuestionOrder,
  addFormSection,
  type FormSection,
  type FormQuestion,
  type QuestionOption,
} from "@/utils/supabase/admin";

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

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    setSaving(true);
    setError(null);
    try {
      await deleteQuestion(questionId);
      await loadQuestions();
      if (selectedQuestion?.id === questionId) setSelectedQuestion(null);
      if (editingQuestion?.id === questionId) setEditingQuestion(null);
      showSuccess("Question deleted");
    } catch (err: any) {
      setError("Failed to delete question: " + err.message);
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
      const maxOrder = currentQuestions.reduce(
        (max, q) => Math.max(max, q.formorder ?? 0),
        0
      );
      console.log("helloworld");
      await addQuestion(activeSection, maxOrder, newQuestion);
      await loadQuestions();
      setShowAddQuestion(false);
      showSuccess("Question added successfully");
    } catch (err: any) {
      setError("Failed to add question: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMoveQuestion = async (
    questionId: number,
    direction: "up" | "down"
  ) => {
    const idx = currentQuestions.findIndex((q) => q.id === questionId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= currentQuestions.length) return;
    const thisQ = currentQuestions[idx];
    const swapQ = currentQuestions[swapIdx];
    if (!thisQ.question_key_id || !swapQ.question_key_id) return;

    setSaving(true);
    try {
      await swapQuestionOrder(
        thisQ.question_key_id,
        thisQ.formorder,
        swapQ.question_key_id,
        swapQ.formorder
      );
      await loadQuestions();
    } catch (err: any) {
      setError("Failed to reorder: " + err.message);
    } finally {
      setSaving(false);
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
        <AdminNavBar />

        {/* Header */}
        <div className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-8 shadow-lg">
          <div className="max-w-[100vw] mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Image
                src="/images/sapaa-icon-white.png"
                alt="SAPAA"
                width={48}
                height={48}
                className="w-12 h-12 flex-shrink-0"
              />
              <h1 className="text-4xl font-bold font-heading">Form Editor</h1>
            </div>
            <p className="text-[#E4EBE4] text-lg">
              Manage inspection form sections and questions
            </p>
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
                      <button
                        key={section.id}
                        onClick={() => {
                          setActiveSection(section.id);
                          setSelectedQuestion(null);
                          setEditingQuestion(null);
                          setShowAddQuestion(false);
                        }}
                        className={`w-full text-left px-3 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                          activeSection === section.id
                            ? "bg-[#EEF5EF] text-[#356B43] border-2 border-[#356B43]"
                            : "text-[#7A8075] border-2 border-[#E4EBE4] hover:border-[#86A98A]"
                        }`}
                      >
                        <span className="truncate">
                          {section.header || section.title}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                            activeSection === section.id
                              ? "bg-[#356B43] text-white"
                              : "bg-[#E4EBE4] text-[#7A8075]"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
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
                  onCancel={() => setShowAddQuestion(false)}
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
                <div className="space-y-3">
                  {currentQuestions.map((question, idx) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      index={idx}
                      total={currentQuestions.length}
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
                      onDelete={() => handleDeleteQuestion(question.id)}
                      onMoveUp={() => handleMoveQuestion(question.id, "up")}
                      onMoveDown={() =>
                        handleMoveQuestion(question.id, "down")
                      }
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
              )}
            </div>

            {/* ── Right: Preview Panel ── */}
            <div className="w-[340px] flex-shrink-0 hidden lg:block">
              <div className="bg-[#F7F2EA] rounded-2xl border-2 border-[#E4EBE4] p-5 sticky top-6">
                <h3 className="text-xs font-bold text-[#7A8075] uppercase tracking-wider mb-4">
                  Preview
                </h3>
                {selectedQuestion ? (
                  <PreviewPanel question={selectedQuestion} />
                ) : (
                  <div className="text-center py-12">
                    <Eye className="w-10 h-10 text-[#E4EBE4] mx-auto mb-3" />
                    <p className="text-sm text-[#7A8075]">
                      Select a question to preview how it will appear in the
                      inspection form
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// ─── QuestionCard Component ──────────────────────────────────────────
function QuestionCard({
  question,
  index,
  total,
  isSelected,
  isEditing,
  saving,
  onSelect,
  onEdit,
  onDelete,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  onSave,
  onCancelEdit,
  editingQuestion,
  onEditingChange,
}: {
  question: FormQuestion;
  index: number;
  total: number;
  isSelected: boolean;
  isEditing: boolean;
  saving: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: (id: number, currentStatus: boolean) => Promise<void>;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSave: (q: FormQuestion) => void;
  onCancelEdit: () => void;
  editingQuestion: FormQuestion | null;
  onEditingChange: (q: FormQuestion | null) => void;
}) {
  const TypeIcon = getTypeIcon(question.question_type);

  if (isEditing && editingQuestion) {
    return (
      <EditQuestionForm
        question={editingQuestion}
        saving={saving}
        onChange={onEditingChange}
        onSave={() => onSave(editingQuestion)}
        onCancel={onCancelEdit}
      />
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`bg-white border-2 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all hover:shadow-sm ${
        isSelected
          ? "border-[#356B43] shadow-sm"
          : "border-[#E4EBE4] hover:border-[#86A98A]"
      } ${
        !question.is_active ? "opacity-60 bg-gray-50/50 border-dashed" : "" // Visual changes for hidden questions
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <GripVertical className="w-4 h-4 text-[#7A8075] flex-shrink-0 cursor-grab" />
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
            onMoveUp();
          }}
          disabled={index === 0 || saving}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#7A8075] hover:bg-[#E4EBE4] disabled:opacity-30 transition-all"
          title="Move up"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          disabled={index === total - 1 || saving}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#7A8075] hover:bg-[#E4EBE4] disabled:opacity-30 transition-all"
          title="Move down"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#356B43] hover:bg-[#EEF5EF] transition-all"
          title="Edit"
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
            <select
              value={question.question_type.trim()}
              onChange={(e) =>
                onChange({ ...question, question_type: e.target.value })
              }
              className="w-full mt-1 px-3 py-2.5 border-2 border-[#E4EBE4] rounded-xl text-sm focus:outline-none focus:border-[#356B43] bg-white transition-colors"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
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
}: {
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
}) {
  const [title, setTitle] = useState("");
  const [subtext, setSubtext] = useState("");
  const [type, setType] = useState("option");
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState(["", ""]);
  const [questionKey, setQuestionKey] = useState("");

  const needsOptions = ["option", "selectall"].includes(type);

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
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Are there signs of erosion?"
            className="w-full mt-1 px-3 py-2.5 border-2 border-[#E4EBE4] rounded-xl text-sm focus:outline-none focus:border-[#356B43] transition-colors placeholder:text-[#7A8075]"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7A8075] uppercase tracking-wide">
            Description / Subtext
          </label>
          <textarea
            value={subtext}
            onChange={(e) => setSubtext(e.target.value)}
            placeholder="Additional context for the question (optional)"
            rows={2}
            className="w-full mt-1 px-3 py-2.5 border-2 border-[#E4EBE4] rounded-xl text-sm focus:outline-none focus:border-[#356B43] resize-none transition-colors placeholder:text-[#7A8075]"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7A8075] uppercase tracking-wide">
            Question Key
          </label>
          <input
            type="text"
            value={questionKey}
            onChange={(e) => setQuestionKey(e.target.value)}
            placeholder="e.g. Q111_erosion"
            className="w-full mt-1 px-3 py-2.5 border-2 border-[#E4EBE4] rounded-xl text-sm focus:outline-none focus:border-[#356B43] transition-colors placeholder:text-[#7A8075]"
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
