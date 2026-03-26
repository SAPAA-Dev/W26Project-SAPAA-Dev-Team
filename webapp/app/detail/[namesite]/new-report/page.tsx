"use client";

import { getQuestionsOnline, isSteward, addSiteInspectionReport, getSitesOnline, getCurrentUserUid, getCurrentSiteId, getQuestionResponseType, uploadSiteInspectionAnswers, insertInspectionAttachments, rollbackSiteInspectionSubmission} from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
import React, { useState, useEffect, useCallback } from "react";
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


interface ImageWithMeta {
  id: string;
  file: File;
  caption: string;
  identifier: string;
  photographer: string;
  date: string;
  siteName: string;
}

interface SectionNavigationState {
  isOnLastSection: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  goToPreviousSection?: () => void;
  goToNextSection?: () => void;
}


export default function NewReportPage() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const namesite = decodeURIComponent(params.namesite as string);
  
  const [hasAccepted, setHasAccepted] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [hasDismissedVerification, setHasDismissedVerification] = useState(false);
  const [responses, setResponses] = useState<Record<number, any>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentUser, setCurrentUser] = useState<{ email: string; role: string; name: string; avatar: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStewardUser, setIsStewardUser] = useState(false);
  const [showRequiredPopup, setShowRequiredPopup] = useState(false);
  const [missingRequiredQuestionNumbers, setMissingRequiredQuestionNumbers] = useState<string[]>([]);
  const [draftKey, setDraftKey] = useState<string | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);  const [sectionNavigation, setSectionNavigation] = useState<SectionNavigationState>({
    isOnLastSection: false,
    canGoPrevious: false,
    canGoNext: false,
  });

  const handleSectionStateChange = useCallback((state: {
    isOnLastSection: boolean;
    canGoPrevious: boolean;
    canGoNext: boolean;
    goToPreviousSection: () => void;
    goToNextSection: () => void;
  }) => {
    setSectionNavigation((previousState) => {
      if (
        previousState.isOnLastSection === state.isOnLastSection &&
        previousState.canGoPrevious === state.canGoPrevious &&
        previousState.canGoNext === state.canGoNext &&
        previousState.goToPreviousSection === state.goToPreviousSection &&
        previousState.goToNextSection === state.goToNextSection
      ) {
        return previousState;
      }

      return state;
    });
  }, []);

  console.log("NewReportPage render");


  useEffect(() => {
      console.log("verification effect ran", { hasDismissedVerification });
    const fetchUserAndCheckSteward = async () => {
      try {
        setIsLoading(true);
        const user = await getCurrentUser();
        setCurrentUser(user);
        
        if (user?.email) {
          const stewardStatus = await isSteward(user.email);
          setIsStewardUser(stewardStatus);

          if (!stewardStatus && !hasDismissedVerification) {
            setHasAccepted(false);   //new
            setShowVerification(true);
          }
        } else if (!hasDismissedVerification) {
          setHasAccepted(false);
          setShowVerification(true);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setCurrentUser(null);
        if (!hasDismissedVerification) {
        setShowVerification(true);
       }
      } finally {
        setIsLoading(false);
      }
    };
    
      fetchUserAndCheckSteward();
    }, [hasDismissedVerification]);

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
          const parsed = JSON.parse(savedDraft);

          const normalizedResponses = Object.fromEntries(
            Object.entries(parsed).map(([key, value]) => {
              if (Array.isArray(value)) {
                return [
                  key,
                  value.map((item) => {
                    if (item && typeof item === 'object' && 'previewUrl' in item) {
                      return {
                        caption: '',
                        identifier: '',
                        photographer: '',
                        date: '',
                        ...item,
                      };
                    }
                    return item;
                  }),
                ];
              }
              return [key, value];
            })
          );

          setResponses(normalizedResponses);
      console.log("Draft restored");
    }

    setIsDraftLoaded(true); // VERY IMPORTANT
  }, [draftKey]);



    

  useEffect(() => {
    if (!draftKey || !isDraftLoaded) return;

    localStorage.setItem(draftKey, JSON.stringify(responses));
    console.log("Draft saved");
  }, [responses, draftKey, isDraftLoaded]);






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
    const questionNumberMap: Record<number, string> = {};
    for (const question of formQuestions) {
      const match = (question.title ?? '').match(/\(Q(\d+(?:\.\d+)?)\)/i);
      questionNumberMap[question.id] = match ? `Q${match[1]}` : `Question ${question.id}`;
    }
    return questionNumberMap;
  };

  const sortQuestionNumbers = (questionNumbers: string[]): string[] => {
    const getQuestionNumberValue = (questionNumber: string): number => {
      const match = questionNumber.match(/(\d+(?:\.\d+)?)/);
      return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
    };

    return [...questionNumbers].sort((a, b) => {
      const aValue = getQuestionNumberValue(a);
      const bValue = getQuestionNumberValue(b);

      if (aValue !== bValue) {
        return aValue - bValue;
      }

      return a.localeCompare(b, undefined, { numeric: true });
    });
  };


  const PRESIGN_ROUTE = "/api/s3/presign";

  async function getPresignedUrl(input: {
    filename: string;
    contentType: string;
    fileSize: number;
    siteId: number;
    responseId: number;
    questionId: number;
    date: string;
    photographer: string;
    identifier: string;
    siteName: string;
  }) {
    const res = await fetch(PRESIGN_ROUTE, {
      method: "POST",
      credentials: "include",
      redirect: "error",  
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Presign route failed:", err);
      throw new Error(
        err?.error || err?.message || `Failed to get presigned URL (${res.status})`
      );
    }

    return (await res.json()) as {
            uploadUrl: string;
            key: string;
            generatedFilename: string;
          };
  }

  async function uploadFileToS3(uploadUrl: string, file: File) {
  // 1) Validate URL + detect mixed content
  const u = new URL(uploadUrl);
  console.log("S3 upload URL origin:", u.origin);
  console.log("App origin:", window.location.origin);
  console.log("S3 upload URL protocol:", u.protocol);

  if (window.location.protocol === "https:" && u.protocol !== "https:") {
    throw new Error("Blocked: uploadUrl is not https (mixed content).");
  }

  // 2) Actually upload
  try {
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      mode: "cors", // explicit
      body: file,
    });

    // If we reach here, browser allowed the request.
    if (!putRes.ok) {
      const text = await putRes.text().catch(() => "");
      console.error("S3 responded:", putRes.status, text);
      throw new Error(`S3 upload failed (${putRes.status})`);
    }
  } catch (e) {
    // If we're here, browser blocked the request (CORS/network/mixed content)
    console.error("Upload blocked at fetch level:", e);
    throw e;
  }
}


  const isImageWithMetaArray = (value: any): value is ImageWithMeta[] => {
    return (
      Array.isArray(value) &&
      value.length > 0 &&
      value[0] &&
      value[0].file instanceof File  //Now answer[0] is not a File anymore.
                                     //It is an object that contains a file
    );
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };


  const handleSubmit = async () => {
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    const questionNumberMap = buildQuestionNumberMap(questions);
    const missingRequiredNumbers = questions
      .filter((question) => question.is_required === true && !isAnswered(responses[question.id]))
      .map((question) => questionNumberMap[question.id] ?? `Question ${question.id}`);

    if (missingRequiredNumbers.length > 0) {
      setMissingRequiredQuestionNumbers(sortQuestionNumbers(missingRequiredNumbers));
      setShowRequiredPopup(true);
      showToast("Please complete all required questions before submitting.");
      return;
    }

    setShowRequiredPopup(false);
    setMissingRequiredQuestionNumbers([]);
    setIsSubmitting(true);

    let siteInspectionReportId: number | null = null;

    try {
      const siteId = await getCurrentSiteId(namesite);
      const userUid = await getCurrentUserUid();
      siteInspectionReportId = (await addSiteInspectionReport(siteId, userUid)).id;

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
      //what goes into W26_answers table: response_id, question_id, obs_value, obs_comm
      let answersArray: SupabaseAnswer[] = [];  


      //what goes into W26_attachments table: response_id, question_id, storage_key, filename, content_type, file_size_bytes, caption, identifier
      // We also need to prepare the data for the attachments table, which means we need to generate the S3 keys for each uploaded file and store those in an array of objects/dictionaries as well
      const attachmentsRows: Array<{
        response_id: number;
        question_id: number;
        site_id: number;
        storage_key: string;
        filename?: string | null;
        content_type?: string | null;
        file_size_bytes?: number | null;
        caption?: string | null;
        photographer?: string | null;
        identifier?: string | null;
        date?: string | null;
      }> = [];



      //image  
      for (const [questionId, answer] of Object.entries(responses)) {
        if (isImageWithMetaArray(answer)) {
              const imageList = answer;

              for (const image of imageList) {
                const file = image.file;
                // 1) get presigned URL + generated key from your API

                if (!image.caption.trim()) {
                  throw new Error("Each uploaded image must have a caption.");
                }
                if (!image.date?.trim()) {
                  throw new Error("Each uploaded image must have a date.");
                }    
                if (!image.identifier.trim()) {
                  throw new Error("Each uploaded image must have an identifier.");
                }
                
                if (image.identifier.replace(/\s/g, '').length > 20) {
                  throw new Error("Identifier must be 20 characters or fewer (excluding spaces).");
                }

                if (!image.photographer.trim()) {
                  throw new Error("Each uploaded image must include the photographer name.");
                }

                if (image.photographer.replace(/\s/g, '').length > 25) {
                  throw new Error("Photographer name must be 25 characters or fewer.");
                }    
                                
                const { uploadUrl, key, generatedFilename } = await getPresignedUrl({
                  
                  filename: file.name,
                  contentType: file.type,
                  fileSize: file.size,
                  responseId: siteInspectionReportId!,
                  questionId: Number(questionId),
                  siteId: Number(siteId),
                  date: image.date,
                  photographer: image.photographer,
                  identifier: image.identifier,
                  siteName: namesite,
                }); 

                // 2) upload the file to S3 using the presigned URL
                await uploadFileToS3(uploadUrl, file);

                attachmentsRows.push({
                    response_id: siteInspectionReportId,
                    question_id: Number(questionId),
                    site_id: Number(siteId),
                    storage_key: key,
                    filename: generatedFilename,
                    content_type: file.type,
                    file_size_bytes: file.size,
                    caption: image.caption.trim() || null,
                    photographer: image.photographer.trim() || null,
                    identifier: image.identifier.trim() || null,
                    date: image.date.trim() || null,
                  });
              }

              // Do NOT put image data into W26_answers
              continue;
            }

            if (String(questionId).includes('_comm')) continue;

            const questionConfig = observationTypeMap.get(questionId);
            const isValueType = questionConfig?.obs_value == 1;
            const isCommType = questionConfig?.obs_comm == 1;
            
            const commValue = (responses as Record<string, any>)[`${questionId}_comm`] ?? null;
            
            if (Array.isArray(answer)) {
                answer.forEach(subAnswer => {
                    const isOther = subAnswer === 'Other';
                    answersArray.push({
                        response_id: siteInspectionReportId!,
                        question_id: Number(questionId),
                        obs_value: isValueType ? String(subAnswer) : null,
                        obs_comm: isOther ? commValue : (isCommType ? String(subAnswer) : null),
                    });
                });
            } else {
                const isOther = answer === 'Other';
                answersArray.push({
                    response_id: siteInspectionReportId!,
                    question_id: Number(questionId),
                    obs_value: isValueType ? String(answer) : null,
                    obs_comm: isOther ? commValue : (isCommType ? String(answer) : null),
                });
            }
          }
            if (answersArray.length > 0) {
            await uploadSiteInspectionAnswers(answersArray);
          }

          if (attachmentsRows.length > 0) {
            await insertInspectionAttachments(attachmentsRows);
          }



            if (draftKey) {
              localStorage.removeItem(draftKey);
            }
            console.log("Draft cleared after successful submission");
            router.push('/sites?submitted=true');
          } catch (error) {
            console.error(error);
            if (siteInspectionReportId !== null) {
              try {
                await rollbackSiteInspectionSubmission(siteInspectionReportId);
              } catch (rollbackError) {
                console.error('Failed to roll back incomplete submission:', rollbackError);
              }
            }
            setIsSubmitting(false);
          }
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

      {toastMessage && (
        <div className="fixed top-5 right-5 z-[200] max-w-md animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-[#B91C1C] text-white px-4 py-3 rounded-xl shadow-xl border border-red-300">
            <p className="text-sm font-medium">{toastMessage}</p>
          </div>
        </div>
      )}
            
      {/* --- VERIFICATION POPUP  --- */}
      {showVerification && !isStewardUser && (
        <div data-testid="fine-print-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
           <div 
            data-testid="fine-print-overlay"
            className="absolute inset-0 bg-[#254431]/80 backdrop-blur-sm" 
          />
          <div className="relative bg-white w-full max-w-lg sm:max-w-xl lg:max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden lg:max-h-none overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-[#E4EBE4] flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F7F2EA] rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#356B43]" />
              </div>
              <h2 className="text-xl font-bold text-[#254431]">The Fine Print Up Front</h2>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
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
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  data-testid="terms-checkbox" 
                  checked={hasAccepted}
                  onChange={(e) => setHasAccepted(e.target.checked)}
                  className="w-5 h-5 mt-1 rounded border-[#E4EBE4] text-[#356B43] focus:ring-[#356B43]"
                />
                <div className="text-sm text-[#4B5563] leading-relaxed">
                  By agreeing to this, I understand that this form is being used solely for 
                  filling out <strong>Site Inspections</strong> and <strong>not for EMERGENCIES</strong>. I also
                  acknowledge that this Site Inspection is carried out on my own accord.
                  
                  <div className="mt-3">
                    I have read and agree to the{" "}
                    <Link href={{ pathname: "/terms", query: { from: pathname } }}>
                      <span className="text-[#356B43] underline font-medium hover:text-[#254431] transition-colors">
                        terms and conditions
                      </span>
                    </Link>
                  </div>
                </div>
              </label>
            </div>

            <div className="p-6 border-t border-[#E4EBE4] bg-[#F7F2EA]/50 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => router.push(`/detail/${encodeURIComponent(namesite)}`)}
                  className="w-full sm:flex-1 py-3 text-[#7A8075] font-bold hover:bg-[#E4EBE4] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!hasAccepted}
                  onClick={() => {
                    console.log("continue clicked");
                    setShowVerification(false);
                    setHasDismissedVerification(true);
                  }}
                  className="w-full sm:flex-[2] py-3 bg-[#356B43] text-white font-bold rounded-xl shadow-lg hover:bg-[#254431] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
          <div 
            data-testid="required-popup-overlay"
            className="absolute inset-0 bg-[#254431]/80 backdrop-blur-sm" 
          />
          <div className="relative bg-white w-full max-w-lg sm:max-w-xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-[#E4EBE4] flex items-center gap-3">
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
                type="button"
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
      <header className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-4 sm:px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto">

        <button
          type="button"
          onClick={() => router.push(`/detail/${encodeURIComponent(namesite)}`)}
          className="flex items-center gap-1.5 text-[#86A98A] hover:text-white transition-colors mb-4 group"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Site</span>
        </button>

        <div className="flex items-start justify-between">

          {/* Left: icon + form info */}
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <Image
              src="/images/sapaa-icon-white.png"
              alt="SAPAA"
              width={140}
              height={140}
              priority
              className="h-12 sm:h-16 w-auto flex-shrink-0 opacity-100 mt-1"
            />
            <div>
              <h1 className="text-3xl font-bold mt-2.5">Site Inspection Form</h1>
              <div className="text-[#E4EBE4]">
                <span className="text-base">{namesite}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

      {/* --- MAIN LAYOUT --- */}
      <MainContent 
        responses={responses}
        onResponsesChange={handleResponsesChange}
        onSectionStateChange={handleSectionStateChange}
        siteName={namesite}
        currentUser={currentUser}
      />


      {/* --- STICKY FOOTER --- */}
      <StickyFooter 
        questions={questions}
        responses={responses}
        onSubmit={handleSubmit}
        onPreviousSection={sectionNavigation.goToPreviousSection}
        onNextSection={sectionNavigation.goToNextSection}
        isSubmitting={isSubmitting}
        isSubmitEnabled={sectionNavigation.isOnLastSection}
        canGoPrevious={sectionNavigation.canGoPrevious}
        canGoNext={sectionNavigation.canGoNext}
      />
    </div>
  );
}
