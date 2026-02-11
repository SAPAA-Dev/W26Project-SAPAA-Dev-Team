"use client";

import React from "react";

interface Question {
  id: number;
  text: string | null;
  question_type: string;
  section: number;
  answers: any[];
}

interface StickyFooterProps {
  questions?: Question[];
  responses?: Record<number, any>;
  onSubmit?: () => void;
}

export default function StickyFooter({ 
  questions = [], 
  responses = {},
  onSubmit 
}: StickyFooterProps) {
  const totalQuestions = questions.length;

  const answeredCount = Object.keys(responses).filter(key => {
    const value = responses[Number(key)];
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (value === false) return false;
    return true;
  }).length;

  const progressPercentage = totalQuestions > 0 
    ? (answeredCount / totalQuestions) * 100 
    : 0;

  const canSubmit = answeredCount > 0;

  return (
    <footer className="sticky bottom-0 bg-white border-t-2 border-[#E4EBE4] p-4 md:px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:flex-1">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-bold text-[#254431]">Overall Progress</span>
            <span className="text-sm font-medium text-[#7A8075]">
              {answeredCount} / {totalQuestions} answered
            </span>
          </div>
          <div className="h-3 w-full bg-[#F7F2EA] rounded-full overflow-hidden border border-[#E4EBE4]">
            <div 
              className="h-full bg-gradient-to-r from-[#356B43] to-[#254431] transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        <button 
          disabled={!canSubmit}
          onClick={onSubmit}
          className="w-full md:w-auto px-8 py-3 bg-[#254431] text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1e3828] transition-colors shadow-lg"
        >
          Review & Submit
        </button>
      </div>
    </footer>
  );
}