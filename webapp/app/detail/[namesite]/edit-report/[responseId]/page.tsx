"use client";

import {
  getQuestionsOnline,
  isSteward,
  getFormResponseById,
  updateSiteInspectionAnswers,
  getResponseOwnerId,
  getQuestionResponseType,
} from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
import React, { useState, useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  Pencil,
} from "lucide-react";
import Image from "next/image";
import MainContent from "../../new-report/MainContent";
import StickyFooter from "../../new-report/Footer";

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? '',
    role: user.user_metadata?.role ?? 'steward',
    name: user.user_metadata?.full_name ?? '',
    avatar: user.user_metadata?.avatar_url ?? '',
    phone: user.user_metadata?.phone ?? user.phone ?? undefined,
  };
}

interface Question {
  id: number;
  title: string | null;
  text: string | null;
  question_type: string;
  section: number;
  answers: any[];
  formorder?: number | null;
  is_required?: boolean | null;
}

interface SupabaseAnswerRow {
  question_id: number;
  obs_value: string | null;
  obs_comm: string | null;
}

export default function EditReportPage() {
  const params = useParams<{ namesite: string; responseId: string }>();
  const router = useRouter();
  const namesite = decodeURIComponent(params.namesite as string);
  const responseId = Number(params.responseId);

  const [responses, setResponses] = useState<Record<number | string, any>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentUser, setCurrentUser] = useState<{ email: string; role: string; name: string; avatar: string } | null>(null);
  const [isStewardUser, setIsStewardUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showRequiredPopup, setShowRequiredPopup] = useState(false);
  const [missingRequiredQuestionNumbers, setMissingRequiredQuestionNumbers] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);

        const [user, questionsData, existingAnswers] = await Promise.all([
          getCurrentUser(),
          getQuestionsOnline(),
          getFormResponseById(responseId),
        ]);
        
        setCurrentUser(user);
        setQuestions(questionsData || []);
        setResponses(existingAnswers);
        
        if (user?.email) {
          const stewardStatus = await isSteward(user.email);
          setIsStewardUser(stewardStatus);
        }
        
        const [ownerId, { data: { user: authUser } }] = await Promise.all([
          getResponseOwnerId(responseId),
          createClient().auth.getUser(),
        ]);
        
        console.log('ownerId:', ownerId, 'authUser:', authUser?.id);
        
        if (ownerId && authUser?.id && ownerId === authUser.id) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error('Error initializing edit page:', err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [responseId]);

  const isAnswered = (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "boolean") return value === true;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  };

  const buildQuestionNumberMap = (formQuestions: Question[]): Record<number, string> => {
    const questionNumberMap: Record<number, string> = {};
    for (const question of formQuestions) {
      const match = (question.title ?? '').match(/\(Q(\d+)\)/i);
      questionNumberMap[question.id] = match ? `Q${match[1]}` : `Question ${question.id}`;
    }
    return questionNumberMap;
  };
  
  const handleSubmit = async () => {
    const questionNumberMap = buildQuestionNumberMap(questions);
    const missingRequiredNumbers = questions
      .filter((q) => q.is_required === true && !isAnswered(responses[q.id]))
      .map((q) => questionNumberMap[q.id] ?? `Question ${q.id}`);

    if (missingRequiredNumbers.length > 0) {
      setMissingRequiredQuestionNumbers(missingRequiredNumbers);
      setShowRequiredPopup(true);
      return;
    }

    setShowRequiredPopup(false);
    setMissingRequiredQuestionNumbers([]);

    try {
      const data = await getQuestionResponseType();
      const observationTypeMap = new Map(
        data.map(q => [String(q.question_id), { obs_value: q.obs_value, obs_comm: q.obs_comm }])
      );

      const answersArray: SupabaseAnswerRow[] = [];

      for (const [questionId, answer] of Object.entries(responses)) {
        // Skip the _comm helper keys (e.g. "42_comm") — they're not real question IDs
        if (questionId.includes('_comm')) continue;

        const questionConfig = observationTypeMap.get(questionId);
        const isValueType = questionConfig?.obs_value == 1;
        const isCommType = questionConfig?.obs_comm == 1;

        if (Array.isArray(answer)) {
          answer.forEach(subAnswer => {
            const isOther = subAnswer === 'Other';
            const commValue = isOther ? (responses[`${questionId}_comm`] ?? null) : null;
            answersArray.push({
              question_id: Number(questionId),
              obs_value: isValueType ? String(subAnswer) : null,
              obs_comm: isOther ? commValue : (isCommType ? String(subAnswer) : null),
            });
          });
        } else {
          answersArray.push({
            question_id: Number(questionId),
            obs_value: isValueType ? String(answer) : null,
            obs_comm: isCommType ? String(answer) : null,
          });
        }
      }

      await updateSiteInspectionAnswers(responseId, answersArray);
      router.push(`/detail/${encodeURIComponent(namesite)}?edited=true`);
    } catch (error) {
      console.error('Error updating report:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-[#E4EBE4] border-t-[#356B43] rounded-full animate-spin"></div>
        <p className="text-[#7A8075] font-medium">Loading report...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#FEE2E2] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-[#B91C1C]" />
          </div>
          <h2 className="text-2xl font-bold text-[#254431] mb-2">Access Denied</h2>
          <p className="text-[#7A8075] mb-6">You can only edit reports that you submitted.</p>
          <button
            onClick={() => router.back()}
            className="bg-gradient-to-r from-[#356B43] to-[#254431] text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F2EA] flex flex-col">

      {/* Required fields popup */}
      {showRequiredPopup && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-[#254431]/80 backdrop-blur-sm" />
          <div className="relative bg-white w-full max-w-lg sm:max-w-xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[#E4EBE4] flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F7F2EA] rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-[#B91C1C]" />
              </div>
              <h2 className="text-xl font-bold text-[#254431]">Required Questions Missing</h2>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <p className="text-[#254431] font-medium">
                You must answer all required questions before saving changes.
              </p>
              <div className="bg-[#F7F2EA] border border-[#E4EBE4] rounded-xl p-4 max-h-64 overflow-y-auto">
                <p className="text-sm font-semibold text-[#254431] mb-2">Missing required questions:</p>
                <ul className="list-disc pl-5 text-sm text-[#7A8075] space-y-1">
                  {missingRequiredQuestionNumbers.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="p-6 border-t border-[#E4EBE4] bg-[#F7F2EA]/50">
              <button
                onClick={() => setShowRequiredPopup(false)}
                className="w-full py-3 bg-[#356B43] text-white font-bold rounded-xl shadow-lg hover:bg-[#254431] transition-all"
              >
                Back to Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1 rounded-lg">
                <Image src="/images/sapaa-icon-white.png" alt="Logo" width={24} height={24} />
              </div>
              <span className="font-bold tracking-widest text-sm opacity-90">SAPAA</span>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-[#356B43] flex items-center justify-center">
                {currentUser?.avatar ? (
                  <Image src={currentUser.avatar} alt="User avatar" width={24} height={24} className="object-cover" />
                ) : (
                  <span className="text-xs font-bold text-white">{currentUser?.name?.[0] ?? "?"}</span>
                )}
              </div>
              <span className="text-sm font-medium">{currentUser?.name}</span>
              {isStewardUser && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Steward</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">Edit Inspection Report</h1>
                </div>
                <p className="text-[#E4EBE4] text-sm">{namesite}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Form — reuses the same MainContent as new-report */}
      <MainContent
        responses={responses}
        onResponsesChange={setResponses}
        siteName={namesite}
        currentUser={currentUser}
      />

      {/* Footer — reuses StickyFooter, but submit saves changes instead of creating */}
      <StickyFooter
        questions={questions}
        responses={responses}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
    </div>
  );
}