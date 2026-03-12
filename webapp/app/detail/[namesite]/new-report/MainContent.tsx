"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronRight, Upload, Image as ImageIcon, Loader2, Lock } from "lucide-react";
import { getQuestionsOnline } from '@/utils/supabase/queries';

interface Answer {
  id?: number;
  text?: string;
  [key: string]: any;
}

interface Question {
  id: number;
  title: string | null;
  text: string | null;
  question_type: string;
  section: number;
  answers: (string | { text: string })[];
  formorder?: number | null;
  sectionTitle?: string | null;
  sectionDescription?: string | null;
  sectionHeader?: string | null;
  is_required?: boolean | null;
  autofill_key?: string | null;
}

interface MainContentProps {
  responses: Record<number, any>;
  onResponsesChange: (responses: Record<number, any>) => void;
  siteName?: string;
  currentUser?: {
    email?: string;
    role?: string;
    name?: string;
    avatar?: string;
    phone?: string;
  } | null;
  // Pre-existing images already uploaded to AWS (edit mode only).
  // Keyed by question_id. These are display-only and cannot be removed.
  existingAttachments?: ExistingAttachment[];
  onExistingAttachmentsChange?: (attachments: ExistingAttachment[]) => void;
}

// An image already persisted in AWS + W26_attachments
export interface ExistingAttachment {
  id: number;           // W26_attachments.id — used for metadata updates
  question_id: number;
  storage_key: string;
  filename: string | null;
  content_type: string | null;
  file_size_bytes: number | null;
  caption: string | null;
  description: string | null;
  /** Presigned URL injected by the edit page before passing down */
  previewUrl: string;
}

// A locally-selected image that has not yet been uploaded to AWS
export interface LocalImage {
  id: string;           // crypto.randomUUID() — client-only
  file: File;
  caption: string;
  // description: string;
  identifier: string;
  photographer: string;
  date: string;
  previewUrl: string;
}

export default function MainContent({
  responses,
  onResponsesChange,
  siteName,
  currentUser,
  existingAttachments = [],
  onExistingAttachmentsChange,
}: MainContentProps) {
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const hasAutofilled = useRef(false);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        setLoading(true);
        const data = await getQuestionsOnline();
        setQuestions(data || []);
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  // Cleanup object URLs on unmount to prevent memory leaks (ChatGPT suggestion)
  useEffect(() => {
    return () => {
      Object.values(responses).forEach((value) => {
        if (Array.isArray(value)) {
          value.forEach((item: any) => {
            if (item?.previewUrl && item?.file) {
              // Only revoke locally-created object URLs (local images have a `file` prop)
              URL.revokeObjectURL(item.previewUrl);
            }
          });
        }
      });
    };
  }, []);

  // Autofill known fields (name, email, etc.) on first load
  useEffect(() => {
    if (questions.length === 0 || hasAutofilled.current) return;

    const autofilled: Record<number, any> = {};
    const autofillValues: Record<string, string | undefined> = {
      user_email: currentUser?.email,
      user_name: currentUser?.name,
      user_phone: currentUser?.phone,
      visit_date: new Date().toISOString().split('T')[0],
      site_name: siteName,
    };

    questions.forEach((question) => {
      const key = question.autofill_key;
      if (!key) return;
      const value = autofillValues[key];
      if (value) autofilled[question.id] = value;
    });

    if (Object.keys(autofilled).length > 0) {
      const merged = { ...autofilled, ...responses };
      onResponsesChange(merged);
    }

    hasAutofilled.current = true;
  }, [questions, responses]);

  // ── Section / question organisation ────────────────────────────────────────
  const questionsBySection = questions.reduce((acc, question) => {
    if (!acc[question.section - 2]) acc[question.section - 2] = [];
    acc[question.section - 2].push(question);
    return acc;
  }, {} as Record<number, Question[]>);

  Object.keys(questionsBySection).forEach((sectionKey) => {
    questionsBySection[Number(sectionKey)].sort((a, b) => {
      const orderA = a.formorder ?? Infinity;
      const orderB = b.formorder ?? Infinity;
      return orderA - orderB;
    });
  });

  const sectionMetadata: Record<number, { title: string; description: string; header: string }> = {};
  Object.keys(questionsBySection).forEach((sectionKey) => {
    const sectionNum = Number(sectionKey);
    const firstQuestion = questionsBySection[sectionNum]?.[0];
    sectionMetadata[sectionNum] = {
      title: firstQuestion?.sectionTitle ?? `Section ${sectionNum}`,
      description: firstQuestion?.sectionDescription ?? '',
      header: firstQuestion?.sectionHeader ?? `Section ${sectionNum}`,
    };
  });

  const sections = Object.keys(questionsBySection).map(Number).sort((a, b) => a - b);

  useEffect(() => {
    if (sections.length > 0 && activeSection === null) setActiveSection(sections[0]);
  }, [sections.length]);

  const currentQuestions = questionsBySection[activeSection ?? sections[0] ?? 1] || [];

  const handleResponse = (questionId: number, value: any) => {
    onResponsesChange({ ...responses, [questionId]: value });
  };

  // ── Existing-attachment helpers ─────────────────────────────────────────────
  const existingForQuestion = (questionId: number): ExistingAttachment[] =>
    existingAttachments.filter((a) => a.question_id === questionId);

  const updateExistingField = (
    attachmentId: number,
    field: 'caption' | 'description',
    value: string
  ) => {
    if (!onExistingAttachmentsChange) return;
    onExistingAttachmentsChange(
      existingAttachments.map((a) =>
        a.id === attachmentId ? { ...a, [field]: value } : a
      )
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const renderQuestionInput = (question: Question) => {
    const response = responses[question.id];
    const questionType = question.question_type.trim();

    switch (questionType) {
      case 'option':
        return (
          <div className="space-y-2">
            {(question.answers ?? []).map((answer, index) => {
              const answerText =
                typeof answer === 'object' && answer !== null
                  ? (answer as { text: string }).text
                  : String(answer);
              return (
                <label
                  key={index}
                  className="flex items-center gap-3 p-4 border-2 border-[#E4EBE4] rounded-xl hover:border-[#356B43] cursor-pointer transition-all group"
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={answerText}
                    checked={response === answerText}
                    onChange={(e) => handleResponse(question.id, e.target.value)}
                    className="w-5 h-5 text-[#356B43] focus:ring-[#356B43] focus:ring-2"
                  />
                  <span className="text-[#254431] font-medium group-hover:text-[#356B43] transition-colors">
                    {answerText}
                  </span>
                </label>
              );
            })}
            {response && (
              <button
                type="button"
                onClick={() => {
                  const newResponses = { ...responses };
                  delete (newResponses as Record<string, any>)[`${question.id}_comm`];
                  delete newResponses[question.id];
                  onResponsesChange(newResponses);
                }}
                className="text-sm font-semibold text-[#7A8075] hover:text-[#B91C1C] transition-colors"
              >
                ✕ Clear selection
              </button>
            )}
          </div>
        );
      
        case 'selectall':
          return (
            <div className="space-y-2">
              {(question.answers ?? []).map((answer, index) => {
                const answerText =
                  typeof answer === 'object' && answer !== null
                    ? (answer as { text: string }).text
                    : String(answer);
                const selectedAnswers = Array.isArray(response) ? response : [];
                const isChecked = selectedAnswers.includes(answerText);
                return (
                  <label
                    key={index}
                    className="flex items-center gap-3 p-4 border-2 border-[#E4EBE4] rounded-xl hover:border-[#356B43] cursor-pointer transition-all group"
                  >
                    <input
                      type="checkbox"
                      value={answerText}
                      checked={isChecked}
                      onChange={(e) => {
                        const currentSelections = Array.isArray(response) ? [...response] : [];
                        if (e.target.checked) {
                          handleResponse(question.id, [...currentSelections, answerText]);
                        } else {
                          // ── Single onResponsesChange call to avoid overwrite bug ──
                          const newSelections = currentSelections.filter((item) => item !== answerText);
                          const newResponses = { ...responses, [question.id]: newSelections };
                          if (answerText === 'Other') {
                            delete (newResponses as Record<string, any>)[`${question.id}_comm`];
                          }
                          onResponsesChange(newResponses);
                        }
                      }}
                      className="w-5 h-5 rounded border-2 border-[#E4EBE4] text-[#356B43] focus:ring-[#356B43] focus:ring-2"
                    />
                    <span className="text-[#254431] font-medium group-hover:text-[#356B43] transition-colors">
                      {answerText}
                    </span>
                  </label>
                );
              })}
        
              {/* Other free-text — only when Other is checked */}
              {Array.isArray(response) && response.includes('Other') && (
                <div className="ml-2 pl-4 border-l-2 border-[#356B43]/30">
                  <label className="block text-sm font-semibold text-[#254431] mb-1">
                    Please specify "Other":
                  </label>
                  <textarea
                    value={(responses as Record<string, any>)[`${question.id}_comm`] ?? ''}
                    onChange={(e) =>
                      onResponsesChange({ ...responses, [`${question.id}_comm`]: e.target.value })
                    }
                    placeholder='Describe what "Other" means here...'
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-[#E4EBE4] rounded-xl focus:border-[#356B43] focus:outline-none transition-colors text-[#254431] font-medium resize-none placeholder:text-[#7A8075]"
                  />
                </div>
              )}
        
              {response && Array.isArray(response) && response.length > 0 && (
                <div className="mt-3 p-3 bg-[#356B43]/10 rounded-lg">
                  <p className="text-sm text-[#356B43] font-semibold">
                    {response.length} option{response.length > 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>
          );
          
      case 'text':
      case 'text\n':
        return (
          <textarea
            value={response || ''}
            onChange={(e) => handleResponse(question.id, e.target.value)}
            data-testid={`question-input-${question.id}`}
            placeholder="Enter your response here..."
            rows={4}
            className="w-full px-4 py-3 border-2 border-[#E4EBE4] rounded-xl focus:border-[#356B43] focus:outline-none transition-colors text-[#254431] font-medium resize-none placeholder:text-[#7A8075]"
          />
        );

      case 'agreement':
        return (
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-5 border-2 border-[#E4EBE4] rounded-xl hover:border-[#356B43] cursor-pointer transition-all bg-white">
              <input
                type="checkbox"
                checked={response === true}
                onChange={(e) => handleResponse(question.id, e.target.checked)}
                className="w-6 h-6 rounded border-2 border-[#E4EBE4] text-[#356B43] focus:ring-[#356B43] focus:ring-2"
              />
              <span className="text-[#254431] font-semibold">I agree to the terms</span>
            </label>
          </div>
        );

      case 'site_select':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={response || ''}
              onChange={(e) => handleResponse(question.id, e.target.value)}
              placeholder="Start typing to search for a protected area..."
              className="w-full px-4 py-3 border-2 border-[#E4EBE4] rounded-xl focus:border-[#356B43] focus:outline-none transition-colors text-[#254431] font-medium placeholder:text-[#7A8075]"
            />
            <p className="text-xs text-[#7A8075]">Enter the name of the protected area you visited</p>
          </div>
        );

      case 'date':
        return (
          <div className="space-y-2">
            <input
              type="date"
              value={response || ''}
              onChange={(e) => handleResponse(question.id, e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#E4EBE4] rounded-xl focus:border-[#356B43] focus:outline-none transition-colors text-[#254431] font-medium placeholder:text-[#7A8075]"
            />
            <p className="text-xs text-[#7A8075]">Enter the date you visited the site</p>
          </div>
        );

      case 'image': {
        // Local images: newly picked files, not yet uploaded — stored in responses[question.id]
        const localImages: LocalImage[] = Array.isArray(response) ? (response as LocalImage[]) : [];
        // Existing images: already in AWS — pulled from the existingAttachments prop
        const persistedImages: ExistingAttachment[] = existingForQuestion(question.id);

        const addFiles = (newFiles: File[]) => {
          const newImages: LocalImage[] = newFiles.map((file) => ({
            id: crypto.randomUUID(),
            file,
            caption: '',
            // description: '',
            identifier: '',
            photographer: '',
            date: new Date().toISOString().split('T')[0],
            previewUrl: URL.createObjectURL(file),
          }));
          handleResponse(question.id, [...localImages, ...newImages]);
        };

        const removeLocalImage = (imageId: string) => {
          const img = localImages.find((i) => i.id === imageId);
          if (img) URL.revokeObjectURL(img.previewUrl);
          handleResponse(question.id, localImages.filter((i) => i.id !== imageId));
        };

        const updateLocalField = (
          imageId: string,
          field: 'caption' | 'identifier' | 'photographer' | 'date',
          value: string
        ) => {
          handleResponse(
            question.id,
            localImages.map((img) => (img.id === imageId ? { ...img, [field]: value } : img))
          );
        };

        const totalCount = persistedImages.length + localImages.length;

        return (
          <div className="space-y-3">
            {/* Upload zone */}
            <div className="border-2 border-dashed border-[#E4EBE4] rounded-xl p-8 text-center hover:border-[#356B43] transition-colors bg-[#F7F2EA]/30">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const newFiles = Array.from(e.target.files || []);
                  if (newFiles.length > 0) addFiles(newFiles);
                  e.currentTarget.value = '';
                }}
                className="hidden"
                id={`image-upload-${question.id}`}
              />
              <label
                htmlFor={`image-upload-${question.id}`}
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <ImageIcon className="w-8 h-8 text-[#356B43]" />
                </div>
                <div>
                  <p className="text-[#254431] font-bold text-lg">Click to upload images</p>
                  <p className="text-sm text-[#7A8075] mt-1">PNG, JPG, WEBP up to 10MB each</p>
                </div>
              </label>
            </div>

            {totalCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-[#356B43]/10 rounded-lg">
                <ImageIcon className="w-5 h-5 text-[#356B43]" />
                <span className="text-sm text-[#356B43] font-semibold">
                  {totalCount} image{totalCount > 1 ? 's' : ''} total
                  {persistedImages.length > 0 && ` (${persistedImages.length} previously uploaded)`}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* ── Previously-uploaded images (non-removable) ── */}
              {persistedImages.map((image) => (
                <div
                  key={`existing-${image.id}`}
                  className="flex gap-3 p-3 bg-white border-2 border-[#356B43]/40 rounded-xl"
                >
                  {/* Preview */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#F7F2EA] flex-shrink-0 relative">
                    <img
                      src={image.previewUrl}
                      alt={image.filename ?? 'Uploaded image'}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Lock badge */}
                    <div className="flex items-center gap-1 mb-1">
                      <Lock className="w-3 h-3 text-[#7A8075]" />
                      <span className="text-xs text-[#7A8075] font-medium truncate">
                        {image.filename ?? 'Uploaded image'}
                      </span>
                    </div>

                    <input
                      type="text"
                      value={image.caption ?? ''}
                      onChange={(e) => updateExistingField(image.id, 'caption', e.target.value)}
                      placeholder="Caption (optional)"
                      className="w-full px-3 py-2 border-2 border-[#E4EBE4] rounded-lg focus:border-[#356B43] focus:outline-none transition-colors text-[#254431] text-sm"
                    />

                    <textarea
                      value={image.description ?? ''}
                      onChange={(e) => updateExistingField(image.id, 'description', e.target.value)}
                      placeholder="Description (optional)"
                      rows={2}
                      className="w-full mt-1 px-3 py-2 border-2 border-[#E4EBE4] rounded-lg focus:border-[#356B43] focus:outline-none transition-colors text-[#254431] text-sm resize-none"
                    />

                    <p className="mt-1 text-xs text-[#7A8075] italic flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Previously uploaded — cannot be removed
                    </p>
                  </div>
                </div>
              ))}

              {/* ── Newly-selected local images (removable) ── */}
              {localImages.map((image) => (
                <div
                  key={image.id}
                  className="p-4 bg-white border-2 border-[#E4EBE4] rounded-xl space-y-4"
                >
                  <div className="flex gap-3">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-[#F7F2EA] flex-shrink-0">
                      <img
                        src={image.previewUrl}
                        alt={image.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#254431] truncate text-sm">
                        {image.file.name}
                      </p>
                      <p className="text-xs text-[#7A8075] mt-1">
                        Site: {siteName || "Unknown site"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeLocalImage(image.id)}
                      className="text-sm font-semibold text-[#B91C1C] hover:underline self-start"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#254431] mb-1">
                        Caption <span className="text-[#B91C1C]">*</span>
                      </label>
                      <input
                        type="text"
                        value={image.caption ?? ''}
                        onChange={(e) => updateLocalField(image.id, 'caption', e.target.value)}
                        placeholder="Longer Description"
                        className="w-full px-3 py-2 border-2 border-[#E4EBE4] rounded-lg focus:border-[#356B43] focus:outline-none transition-colors text-[#254431] text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#254431] mb-1">
                        Identifier <span className="text-[#B91C1C]">*</span>
                      </label>
                      <input
                        type="text"
                        value={image.identifier ?? ''}
                        maxLength={20}
                        onChange={(e) => updateLocalField(image.id, 'identifier', e.target.value)}
                        placeholder="Short Description"
                        className="w-full px-3 py-2 border-2 border-[#E4EBE4] rounded-lg focus:border-[#356B43] focus:outline-none transition-colors text-[#254431] text-sm"
                      />
                      <p className="mt-1 text-xs text-[#7A8075]">
                        {(image.identifier ?? '').replace(/\s/g, '').length}/20 characters
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#254431] mb-1">
                      Photographer <span className="text-[#B91C1C]">*</span>
                    </label>
                    <input
                      type="text"
                      value={image.photographer ?? ""}
                      maxLength={25}
                      onChange={(e) => updateLocalField(image.id, 'photographer', e.target.value)}
                      placeholder="Owner of digital file"
                      className="w-full px-3 py-2 border-2 border-[#E4EBE4] rounded-lg focus:border-[#356B43] focus:outline-none transition-colors text-[#254431] text-sm"
                    />
                    <p className="mt-1 text-xs text-[#7A8075]">
                      {(image.photographer ?? "").replace(/\s/g, '').length}/25 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#254431] mb-1">
                      Date <span className="text-[#B91C1C]">*</span>
                    </label>
                    <input
                      type="date"
                      value={image.date ?? ''}
                      onChange={(e) => updateLocalField(image.id, 'date', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-[#E4EBE4] rounded-lg focus:border-[#356B43] focus:outline-none transition-colors text-[#254431] text-sm"
                    />
                    <p className="text-xs text-[#7A8075] mt-1">
                      Enter the date when this image was taken (Date of Visit)
                    </p>
                  </div>
                  </div>

                    {/* <div>
                      <label className="block text-sm font-medium text-[#254431] mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={image.description}
                        onChange={(e) => updateLocalField(image.id, 'description', e.target.value)}
                        placeholder="Optional description"
                        className="w-full px-3 py-2 border-2 border-[#E4EBE4] rounded-lg focus:border-[#356B43] focus:outline-none transition-colors text-[#254431] text-sm"
                      />
                    </div> */}
                  
                </div>
              ))}
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="p-4 bg-[#F7F2EA] rounded-lg text-[#7A8075] border border-[#E4EBE4]">
            <p className="text-sm">
              Unknown question type: <span className="font-mono">{questionType}</span>
            </p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <main className="flex-1 max-w-7xl mx-auto w-full flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#356B43] animate-spin" />
          <p className="text-[#7A8075] font-medium">Loading questions...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white md:bg-transparent p-4 md:py-8 border-b md:border-b-0 border-[#E4EBE4]">
        <nav className="flex md:flex-col gap-2 overflow-x-auto no-scrollbar">
          {sections.map((sectionNum) => {
            const sectionQuestions = questionsBySection[sectionNum] || [];
            const answeredCount = sectionQuestions.filter((q) => {
              const val = responses[q.id];
              return val !== undefined && val !== null && val !== '' && (!Array.isArray(val) || val.length > 0);
            }).length;
            const totalCount = sectionQuestions.length;

            return (
              <button
                key={sectionNum}
                onClick={() => setActiveSection(sectionNum)}
                className={`flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeSection === sectionNum
                    ? 'bg-[#356B43] text-white shadow-md'
                    : 'text-[#7A8075] hover:bg-[#E4EBE4]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                      activeSection === sectionNum ? 'border-white' : 'border-[#7A8075]'
                    }`}
                  >
                    {sectionNum}
                  </span>
                  <span className="whitespace-nowrap">{sectionMetadata[sectionNum].header}</span>
                </div>
                <div
                  className={`text-xs px-2 py-1 rounded-full ${
                    activeSection === sectionNum ? 'bg-white/20' : 'bg-[#E4EBE4]'
                  }`}
                >
                  {answeredCount}/{totalCount}
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Top navigation */}
        {sections.length > 1 && (
          <div className="grid grid-cols-2 gap-3 px-4 md:px-8 pt-4 md:pt-8">
            <div>
              {sections.indexOf(activeSection ?? sections[0]) > 0 && (
                <button
                  onClick={() => {
                    const currentIndex = sections.indexOf(activeSection ?? sections[0]);
                    setActiveSection(sections[currentIndex - 1]);
                  }}
                  className="w-full px-4 py-2 border-2 border-[#E4EBE4] text-[#254431] font-bold rounded-xl hover:bg-[#E4EBE4] transition-all text-sm"
                >
                  ← Previous
                </button>
              )}
            </div>
            <div>
              {sections.indexOf(activeSection ?? sections[0]) < sections.length - 1 && (
                <button
                  onClick={() => {
                    const currentIndex = sections.indexOf(activeSection ?? sections[0]);
                    setActiveSection(sections[currentIndex + 1]);
                  }}
                  className="w-full px-4 py-2 bg-[#356B43] text-white font-bold rounded-xl hover:bg-[#254431] transition-all text-sm"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        )}

        <section className="flex-1 p-4 md:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#254431]">
              {sectionMetadata[activeSection ?? sections[0] ?? 1]?.title ?? `Section ${activeSection}`}
            </h2>
            <p className="text-[#7A8075]">
              {sectionMetadata[activeSection ?? sections[0] ?? 1]?.description &&
                `${sectionMetadata[activeSection ?? sections[0] ?? 1].description} `}
              There are {currentQuestions.length} question{currentQuestions.length !== 1 ? 's' : ''} in this section.
            </p>
          </div>

          <div className="space-y-6">
            {currentQuestions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-[#E4EBE4]">
                <p className="text-[#7A8075] font-medium">No questions available for this section.</p>
              </div>
            ) : (
              currentQuestions.map((question, index) => {
                function stripQuestionCode(title: string) {
                  return title.replace(/\(Q(\d+(?:\.\d+)?)\)/i, '');
                }

                const formattedTitle = question.title
                  ? stripQuestionCode(question.title)
                  : `Question ${activeSection}.${index + 1}`;

                const match = (question.title ?? '').match(/\(Q(\d+(?:\.\d+)?)\)/i);
                const questionNumber = match ? `Q${match[1]}` : `${activeSection}.${index + 1}`;

                const isAnswered = (() => {
                  const val = responses[question.id];
                  // For image questions, also consider existing attachments as "answered"
                  if (question.question_type.trim() === 'image') {
                    return (
                      (val !== undefined && val !== null && (!Array.isArray(val) || val.length > 0)) ||
                      existingForQuestion(question.id).length > 0
                    );
                  }
                  return val !== undefined && val !== null && val !== '' && (!Array.isArray(val) || val.length > 0);
                })();

                return (
                  <div
                    key={question.id}
                    className={`bg-white p-6 rounded-2xl border-2 transition-all ${
                      isAnswered ? 'border-[#356B43] shadow-md' : 'border-[#E4EBE4] shadow-sm'
                    }`}
                  >
                    <div className="mb-5">
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex-shrink-0 w-12 h-10 rounded-lg flex items-center justify-center font-bold text-lg transition-colors ${
                            isAnswered ? 'bg-[#356B43] text-white' : 'bg-[#F7F2EA] text-[#356B43]'
                          }`}
                        >
                          {questionNumber}
                        </span>
                        <div className="flex-1">
                          <h3 className="font-bold text-[#254431] text-lg leading-tight">
                            <span
                              data-testid={`${question.title}-question-title`}>
                            </span>
                            {formattedTitle}</h3>
                          <h4 className="mt-1 text-sm text-[#254431]/70 leading-snug font-normal">
                            {question.text || ''}
                          </h4>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-[#F7F2EA] text-[#7A8075] font-medium">
                              {question.question_type.trim()}
                            </span>
                            {question.is_required === true && (
                              <span className="text-xs px-2 py-1 rounded-full bg-[#FEE2E2] text-[#B91C1C] font-semibold">
                                Required
                              </span>
                            )}
                            {isAnswered && (
                              <span className="text-xs px-2 py-1 rounded-full bg-[#356B43] text-white font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                Answered
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pl-0 md:pl-13">{renderQuestionInput(question)}</div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
