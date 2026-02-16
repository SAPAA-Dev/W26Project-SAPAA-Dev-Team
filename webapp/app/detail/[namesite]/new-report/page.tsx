"use client";

import { getQuestionsOnline, isSteward, addSiteInspectionReport, getSitesOnline, getCurrentUserUid, getCurrentSiteId, getQuestionResponseType, uploadSiteInspectionAnswers } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, usePathname } from "next/navigation";
import { 
  ArrowLeft, 
  User, 
  ChevronRight, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  List
} from "lucide-react";
import Image from "next/image";
import MainContent from "./MainContent";
import StickyFooter from "./Footer";

export async function getCurrentUser() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return {
    id: user.id,
    email: user.email ?? '',
    role: user.user_metadata?.role ?? 'steward',
    name: user.user_metadata?.full_name ?? '',
    avatar: user.user_metadata?.avatar_url ?? '',
    phone: user.user_metadata?.phone ?? user.phone ?? undefined,
  }
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

interface SupabaseAnswer {
  response_id: number; 
  question_id: number;
  obs_value: string | null;
  obs_comm: string | null;
}

export default function NewReportPage() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const namesite = decodeURIComponent(params.namesite as string);
  
  const [hasAccepted, setHasAccepted] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationText, setVerificationText] = useState("");
  const [responses, setResponses] = useState<Record<number, any>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentUser, setCurrentUser] = useState<{ email: string; role: string; name: string; avatar: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStewardUser, setIsStewardUser] = useState(false);
  const [showRequiredPopup, setShowRequiredPopup] = useState(false);
  const [missingRequiredQuestionNumbers, setMissingRequiredQuestionNumbers] = useState<string[]>([]);
  const [draftKey, setDraftKey] = useState<string | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);


  useEffect(() => {
    const fetchUserAndCheckSteward = async () => {
      try {
        setIsLoading(true);
        const user = await getCurrentUser();
        setCurrentUser(user);
        
        if (user?.email) {
          const stewardStatus = await isSteward(user.email);
          setIsStewardUser(stewardStatus);

          setShowVerification(!stewardStatus);
        } else {
          setShowVerification(true);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setCurrentUser(null);
        setShowVerification(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserAndCheckSteward();
  }, []);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const data = await getQuestionsOnline();
        setQuestions(data || []);
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    }
    fetchQuestions();
  }, []);



  //added 
  useEffect(() => {
    const initDraftKey = async () => {
      const userUid = await getCurrentUserUid();
      const siteId = await getCurrentSiteId(namesite);
      // console.log("userUid:", userUid);
      // console.log("siteId:", siteId);

      if (userUid && siteId) {
        const key = `inspection-draft-${userUid}-${siteId}`;
        // console.log("Draft key created:", key);
        setDraftKey(key);
      }
    };

    initDraftKey();
  }, [namesite]);


  useEffect(() => {
    if (!draftKey) return;

    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      setResponses(JSON.parse(savedDraft));
      console.log("Draft restored");
    }

    setIsDraftLoaded(true); // VERY IMPORTANT
  }, [draftKey]);



    

  useEffect(() => {
    if (!draftKey || !isDraftLoaded) return;

    localStorage.setItem(draftKey, JSON.stringify(responses));
    console.log("Draft saved");
  }, [responses, draftKey, isDraftLoaded]);





  const requiredPhrase = "I am not a volunteer of SAPAA";
  const isVerificationValid = verificationText.trim() === requiredPhrase;
  const canProceed = isVerificationValid && hasAccepted;

  const handleResponsesChange = (newResponses: Record<number, any>) => {


    setResponses(newResponses);
  };



  const isAnswered = (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "boolean") return value === true;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  };

  const buildQuestionNumberMap = (formQuestions: Question[]): Record<number, string> => {
    const questionsBySection = formQuestions.reduce((acc, question) => {
      const normalizedSection = question.section - 3;
      if (!acc[normalizedSection]) {
        acc[normalizedSection] = [];
      }
      acc[normalizedSection].push(question);
      return acc;
    }, {} as Record<number, Question[]>);

    Object.keys(questionsBySection).forEach((sectionKey) => {
      questionsBySection[Number(sectionKey)].sort((a, b) => {
        const orderA = a.formorder ?? Infinity;
        const orderB = b.formorder ?? Infinity;
        return orderA - orderB;
      });
    });

    const questionNumberMap: Record<number, string> = {};
    Object.keys(questionsBySection)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((sectionNum) => {
        questionsBySection[sectionNum].forEach((question, index) => {
          questionNumberMap[question.id] = `${sectionNum}.${index + 1}`;
        });
      });

    return questionNumberMap;
  };

  const handleSubmit = async () => {
    const questionNumberMap = buildQuestionNumberMap(questions);
    const missingRequiredNumbers = questions
      .filter((question) => question.is_required === true && !isAnswered(responses[question.id]))
      .map((question) => questionNumberMap[question.id] ?? `Question ${question.id}`);

    if (missingRequiredNumbers.length > 0) {
      setMissingRequiredQuestionNumbers(missingRequiredNumbers);
      setShowRequiredPopup(true);
      return;
    }

    setShowRequiredPopup(false);
    setMissingRequiredQuestionNumbers([]);

    try {
      const siteId = await getCurrentSiteId(namesite);
      const userUid = await getCurrentUserUid();
      const siteInspectionReportId = (await addSiteInspectionReport(siteId, userUid)).id

      // We need to figure out whether the answer to each question should be placed in the obs_value or obs_comm column in Supabase
      // So we convert the question response types into a map that we can search for it
      const data = await getQuestionResponseType();
      const observationTypeMap = new Map(
        data.map(q => [
          String(q.question_id), 
          { obs_value: q.obs_value, obs_comm: q.obs_comm }
        ])
      );

      // Initialize an array to hold all the objects/dictionaries that represent each row in the W26_answers table
      let answersArray: SupabaseAnswer[] = [];  
      for (const [questionId, answer] of Object.entries(responses)) {
            const questionConfig = observationTypeMap.get(questionId);
            // Decide if this question's answer is supposed to go into the obs_value column or obs_comm column
            const isValueType = questionConfig?.obs_value == 1;
            const isCommType = questionConfig?.obs_comm == 1;

            // If the answer has an array containing subAnswers, add each subAnswer as a new object/dictionary inside answersArray
            if (Array.isArray(answer)) {
                answer.forEach(subAnswer => {
                    answersArray.push({
                        response_id: siteInspectionReportId,
                        question_id: Number(questionId),
                        // Put the subAnswer in either the obs_value column or obs_comm column and the other one is set to null
                        obs_value: isValueType ? String(subAnswer) : null,
                        obs_comm: isCommType ? String(subAnswer) : null,
                    });
                });
            } else { // Otherwise, the answer is just a single string so we can add it directly to answersArray
                answersArray.push({
                    response_id: siteInspectionReportId,
                    question_id: Number(questionId),
                    obs_value: isValueType ? String(answer) : null,
                    obs_comm: isCommType ? String(answer) : null,
                });
            }
      }
      await uploadSiteInspectionAnswers(answersArray);
      if (draftKey) {
        localStorage.removeItem(draftKey);
      }
      console.log("Draft cleared after successful submission");
      router.push('/sites?submitted=true');
    } catch (error) {
      console.error(error);
    }
    /**
     * FORM DATA CAPTURED:
     * 
     * 1. USER INFORMATION:
     *    - currentUser.email: User's email address
     *    - currentUser.name: User's full name
     *    - currentUser.role: User's role (e.g., 'steward')
     *    - currentUser.avatar: User's avatar URL
     *    - isStewardUser: Boolean indicating if user is a verified steward
     * 
     * 2. SITE INFORMATION:
     *    - namesite: Name of the protected area being inspected (from URL params)
     *    - pathname: Current page pathname
     * 
     * 3. VERIFICATION DATA (for non-stewards):
     *    - hasAccepted: Boolean - user accepted terms and conditions
     *    - verificationText: String - confirmation text typed by user
     *    - showVerification: Boolean - whether verification popup was shown
     * 
     * 4. QUESTION RESPONSES:
     *    - responses: Record<number, any> - Object mapping question IDs to answers
     *      Structure: { [questionId]: answer }
     *      Answer types vary by question_type:
     *        - 'option': String (selected radio option text)
     *        - 'text'/'text\n': String (textarea content)
     *        - 'agreement': Boolean (checkbox state)
     *        - 'site_select': String (protected area name)
     *        - 'date': String (date in YYYY-MM-DD format)
     *        - 'image': File[] (array of uploaded image files)
     * 
     * 5. QUESTIONS METADATA:
     *    - questions: Question[] - Array of all questions from database
     *      Each question contains:
     *        - id: number
     *        - title: string | null
     *        - text: string | null
     *        - question_type: string
     *        - section: number
     *        - answers: any[] (available answer options)
     * 
     * EXAMPLE DATA STRUCTURE TO SUBMIT:
     * {
     *   user: {
     *     email: currentUser?.email,
     *     name: currentUser?.name,
     *     role: currentUser?.role,
     *     isSteward: isStewardUser
     *   },
     *   site: {
     *     name: namesite,
     *     inspectionDate: new Date().toISOString()
     *   },
     *   verification: {
     *     termsAccepted: hasAccepted,
     *     verificationCompleted: !showVerification
     *   },
     *   responses: responses,
     *   metadata: {
     *     totalQuestions: questions.length,
     *     answeredQuestions: Object.keys(responses).length,
     *     completionRate: (Object.keys(responses).length / questions.length) * 100
     *   }
     * }
     */
    
    //TODO: Handle form submission

    // console.log('Form data to submit:', {
    //   user: currentUser,
    //   site: namesite,
    //   responses: responses,
    //   isSteward: isStewardUser,
    //   termsAccepted: hasAccepted
    // });
  };

  if (isLoading) {
    return (
           <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-[#E4EBE4] border-t-[#356B43] rounded-full animate-spin"></div>
        <p className="text-[#7A8075] font-medium">Loading inspection form...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#F7F2EA] flex flex-col ${showVerification ? 'overflow-hidden max-h-screen' : ''}`}>
      
      {/* --- VERIFICATION POPUP (Only for non-stewards) --- */}
      {showVerification && !isStewardUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-[#254431]/80 backdrop-blur-sm" />
          
          <div className="relative bg-white w-full max-w-lg sm:max-w-xl lg:max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-[#E4EBE4] flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F7F2EA] rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#356B43]" />
              </div>
              <h2 className="text-xl font-bold text-[#254431]">The Fine Print Up Front</h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="font-medium text-[#254431]">Before proceeding with the site inspection form:</p>
              
              <div className="bg-[#F7F2EA] p-4 rounded-xl flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-[#356B43] flex-shrink-0 mt-0.5" />
                <div className="text-sm leading-relaxed text-[#7A8075]">
                  <p className="font-semibold text-[#254431] mb-2">Important Notice:</p>
                  <section className="space-y-4">
                    <p>
                      This reporting system is <strong>not</strong> intended for emergencies.
                      If you encounter any of the situations below, please use the appropriate
                      contact instead:
                    </p>

                    <ul className="list-disc pl-6 space-y-3">
                      <li>
                        <strong>Emergency situations:</strong> Call <strong>911</strong> or
                        contact your local RCMP or police detachment.
                      </li>
                      <li>
                        <strong>Significant damage or disturbances on public land:</strong>{" "}
                        Report illegal activity or public safety issues by calling{" "}
                        <a
                          href="https://www.alberta.ca/report-illegal-activity-call-310-land"
                          target="_blank"
                          className="underline text-[#356B43]"
                        >
                          310-LAND
                        </a>.
                      </li>
                      <li>
                        <strong>Poaching or wildlife concerns:</strong>{" "}
                        Report suspicious or illegal hunting, fishing, or dangerous wildlife
                        encounters{" "}
                        <a
                          href="https://www.alberta.ca/report-poacher"
                          target="_blank"
                          className="underline text-[#356B43]"
                        >
                          online
                        </a>{" "}
                        or by phone at <strong>1-800-642-3800</strong>.
                      </li>
                    </ul>
                  </section>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#254431]">
                  Please type the following to confirm:
                </label>
                <p className="text-sm font-mono bg-[#E4EBE4] px-3 py-2 rounded-lg text-[#254431]">
                  {requiredPhrase}
                </p>
                <input
                  type="text"
                  value={verificationText}
                  onChange={(e) => setVerificationText(e.target.value)}
                  placeholder="Type here..."
                  className="w-full px-4 py-3 border-2 border-[#E4EBE4] rounded-xl focus:border-[#356B43] focus:outline-none transition-colors text-[#254431] font-medium placeholder:text-[#7A8075]"
                />
                {verificationText.length > 0 && !isVerificationValid && (
                  <p className="text-xs text-red-600">Text does not match. Please type exactly as shown above.</p>
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={hasAccepted}
                  onChange={(e) => setHasAccepted(e.target.checked)}
                  className="w-5 h-5 rounded border-[#E4EBE4] text-[#356B43] focus:ring-[#356B43]"
                />
                <span className="text-sm font-semibold text-[#254431]">
                  I have read and agree to the{" "}
                  <Link href={{ pathname: "/terms", query: { from: pathname } }}>
                    <span style={{ textDecoration: "underline" }}>terms and conditions</span>
                  </Link>
                </span>
              </label>
            </div>

            <div className="p-6 border-t border-[#E4EBE4] bg-[#F7F2EA]/50 space-y-3">
              <div className="flex gap-3">
                <button 
                  onClick={() => router.back()}
                  className="flex-1 py-3 text-[#7A8075] font-bold hover:bg-[#E4EBE4] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={!canProceed}
                  onClick={() => setShowVerification(false)}
                  className="flex-[2] py-3 bg-[#356B43] text-white font-bold rounded-xl shadow-lg hover:bg-[#254431] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Continue to Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                You must answer all required questions before submitting this report.
              </p>
              <div className="bg-[#F7F2EA] border border-[#E4EBE4] rounded-xl p-4 max-h-64 overflow-y-auto">
                <p className="text-sm font-semibold text-[#254431] mb-2">
                  Missing required question numbers:
                </p>
                <ul className="list-disc pl-5 text-sm text-[#7A8075] space-y-1">
                  {missingRequiredQuestionNumbers.map((questionNumber) => (
                    <li key={questionNumber}>{questionNumber}</li>
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

      {/* --- CONSOLIDATED HEADER --- */}
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
                  <Image
                    src={currentUser.avatar}
                    alt="User avatar"
                    width={24}
                    height={24}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-white">
                    {currentUser?.name?.[0] ?? "?"}
                  </span>
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
                <h1 className="text-2xl font-bold">Site Inspection Form</h1>
                <p className="text-[#E4EBE4] text-sm">{namesite}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <MainContent 
        responses={responses}
        onResponsesChange={handleResponsesChange}
        siteName={namesite}
        currentUser={currentUser}
      />


      {/* --- STICKY FOOTER --- */}
      <StickyFooter 
        questions={questions}
        responses={responses}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
