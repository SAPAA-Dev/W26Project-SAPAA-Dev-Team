"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronRight, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
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
}

export default function MainContent({ responses, onResponsesChange, siteName, currentUser }: MainContentProps) {
  const [activeSection, setActiveSection] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const hasAutofilled = useRef(false);
  

  useEffect(() => {
    async function fetchQuestions() {
      try {
        setLoading(true);
        const data = await getQuestionsOnline();
      //   console.log('Fetched questions:', data);
      //   console.log('Email question:', data.find(q => 
      //   (q.title ?? '').toLowerCase().includes('email') || 
      //   (q.text ?? '').toLowerCase().includes('email')
      // ));

        setQuestions(data || []);
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (questions.length === 0 || hasAutofilled.current) return;

    const autofilled: Record<number, any> = {};

    const AUTOFILL_MAP: Record<number, () => string | undefined> = {
      32: () => currentUser?.email,
      37: () => new Date().toISOString().split('T')[0], // Autofills to current date but idk if i want that
      35: () => currentUser?.phone ?? undefined,
      34: () => currentUser?.name,
    };

    questions.forEach((question) => {
      // Handle site_select by type
      if (question.question_type.trim() === 'site_select' && siteName) {
        autofilled[question.id] = siteName;
        return;
      }

      // Handle other auto-filled questions by explicit map to id
      const getValue = AUTOFILL_MAP[question.id];
      if (getValue) {
        const value = getValue();
        if (value) autofilled[question.id] = value;
      }
    });

    if (Object.keys(autofilled).length > 0) {
      const merged = { ...autofilled, ...responses };
      onResponsesChange(merged);
    }

    hasAutofilled.current = true;
  }, [questions, responses]);
  
  const questionsBySection = questions.reduce((acc, question) => {
    if (!acc[question.section-3]) {
      acc[question.section-3] = [];
    }
    acc[question.section-3].push(question);
    return acc;
  }, {} as Record<number, Question[]>);

  // Sort questions within each section by formorder
  Object.keys(questionsBySection).forEach(sectionKey => {
    questionsBySection[Number(sectionKey)].sort((a, b) => {
      const orderA = a.formorder ?? Infinity;
      const orderB = b.formorder ?? Infinity;
      return orderA - orderB;
    });
  });
  
  const sectionMetadata: Record<number, { title: string; description: string; header: string}> = {};
    Object.keys(questionsBySection).forEach(sectionKey => {
      const sectionNum = Number(sectionKey);
      const firstQuestion = questionsBySection[sectionNum]?.[0];
      sectionMetadata[sectionNum] = {
        title: firstQuestion?.sectionTitle ?? `Section ${sectionNum}`,
        description: firstQuestion?.sectionDescription ?? '',
        header: firstQuestion?.sectionHeader ?? `Section ${sectionNum}`
    };
  });

  const sections = Object.keys(questionsBySection)
    .map(Number)
    .sort((a, b) => a - b);

  console.log(sections);
  
  const currentQuestions = questionsBySection[activeSection] || [];

  console.log(currentQuestions);

  const handleResponse = (questionId: number, value: any) => {
  const newResponses = {
    ...responses,
    [questionId]: value
  };
  onResponsesChange(newResponses);
};


  const renderQuestionInput = (question: Question) => {
    const response = responses[question.id];
    const questionType = question.question_type.trim();

    switch (questionType) {
      case 'option':
        return (
          <div className="space-y-2">
            {(question.answers ?? []).map((answer, index) => {
              const answerText = typeof answer === 'object' && answer !== null 
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
          </div>
        );

      case 'selectall':
        return (
          <div className="space-y-2">
            {(question.answers ?? []).map((answer, index) => {
              const answerText = typeof answer === 'object' && answer !== null 
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
                        handleResponse(question.id, currentSelections.filter(item => item !== answerText));
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
              <span className="text-[#254431] font-semibold">
                I agree to the terms
              </span>
            </label>
          </div>
        );

      case 'site_select': //not used, here just in case
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={response || ''}
              onChange={(e) => handleResponse(question.id, e.target.value)}
              placeholder="Start typing to search for a protected area..."
              className="w-full px-4 py-3 border-2 border-[#E4EBE4] rounded-xl focus:border-[#356B43] focus:outline-none transition-colors text-[#254431] font-medium placeholder:text-[#7A8075]"
            />
            <p className="text-xs text-[#7A8075] flex items-center gap-1">
              <span>Enter the name of the protected area you visited</span>
            </p>
          </div>
        );

      case 'date':
        return (
          <div className="space-y-2">
            <input
              type="date"
              value={response || ''}
              onChange={(e) => handleResponse(question.id, e.target.value)}
              placeholder=""
              className="w-full px-4 py-3 border-2 border-[#E4EBE4] rounded-xl focus:border-[#356B43] focus:outline-none transition-colors text-[#254431] font-medium placeholder:text-[#7A8075]"
            />
            <p className="text-xs text-[#7A8075] flex items-center gap-1">
              <span>Enter the date of the you visited the site</span>
            </p>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-[#E4EBE4] rounded-xl p-8 text-center hover:border-[#356B43] transition-colors bg-[#F7F2EA]/30">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  handleResponse(question.id, files);
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
            {response && response.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-[#356B43]/10 rounded-lg">
                <ImageIcon className="w-5 h-5 text-[#356B43]" />
                <span className="text-sm text-[#356B43] font-semibold">
                  {response.length} image{response.length > 1 ? 's' : ''} selected
                </span>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="p-4 bg-[#F7F2EA] rounded-lg text-[#7A8075] border border-[#E4EBE4]">
            <p className="text-sm">Unknown question type: <span className="font-mono">{questionType}</span></p>
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
            const answeredCount = sectionQuestions.filter(q => {
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
                    ? "bg-[#356B43] text-white shadow-md"
                    : "text-[#7A8075] hover:bg-[#E4EBE4]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                      activeSection === sectionNum ? "border-white" : "border-[#7A8075]"
                    }`}
                  >
                    {sectionNum}
                  </span>
                  <span className="whitespace-nowrap">{sectionMetadata[sectionNum].header}</span>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  activeSection === sectionNum 
                    ? "bg-white/20" 
                    : "bg-[#E4EBE4]"
                }`}>
                  {answeredCount}/{totalCount}
                </div>
              </button>
            );
          })}
        </nav>
      </aside>
      <section className="flex-1 p-4 md:p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#254431]">
            {sectionMetadata[activeSection]?.title ?? `Section ${activeSection}`}
          </h2>
          <p className="text-[#7A8075]">
            {sectionMetadata[activeSection]?.description && `${sectionMetadata[activeSection].description} `}
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
                return title.replace(/\s*\(Q\d+\)\s*$/, '')
              }
              
              const formattedTitle = question.title 
              ? stripQuestionCode(question.title)
              : `Question ${activeSection}.${index + 1}`

              const questionNumber = `${activeSection}.${index + 1}`;

              const isAnswered = (() => {
                const val = responses[question.id];
                return val !== undefined && val !== null && val !== '' && (!Array.isArray(val) || val.length > 0);
              })();

              return (
                <div
                  key={question.id}
                  className={`bg-white p-6 rounded-2xl border-2 transition-all ${
                    isAnswered 
                      ? 'border-[#356B43] shadow-md' 
                      : 'border-[#E4EBE4] shadow-sm'
                  }`}
                >
                  <div className="mb-5">
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg transition-colors ${
                        isAnswered 
                          ? 'bg-[#356B43] text-white' 
                          : 'bg-[#F7F2EA] text-[#356B43]'
                      }`}>
                        {questionNumber}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-bold text-[#254431] text-lg leading-tight">
                          {formattedTitle}
                        </h3>

                        <h4 className="mt-1 text-sm text-[#254431]/70 leading-snug font-normal">
                          {question.text || ``}
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

                  <div className="pl-0 md:pl-13">
                    {renderQuestionInput(question)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {sections.length > 1 && (
          <div className="flex gap-3 mt-8">
            <button
              onClick={() => {
                const currentIndex = sections.indexOf(activeSection);
                if (currentIndex > 0) {
                  setActiveSection(sections[currentIndex - 1]);
                }
              }}
              disabled={sections.indexOf(activeSection) === 0}
              className="px-6 py-3 border-2 border-[#E4EBE4] text-[#254431] font-bold rounded-xl hover:bg-[#E4EBE4] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ← Previous Section
            </button>
            <button
              onClick={() => {
                const currentIndex = sections.indexOf(activeSection);
                if (currentIndex < sections.length - 1) {
                  setActiveSection(sections[currentIndex + 1]);
                }
              }}
              disabled={sections.indexOf(activeSection) === sections.length - 1}
              className="flex-1 px-6 py-3 bg-[#356B43] text-white font-bold rounded-xl hover:bg-[#254431] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next Section →
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
