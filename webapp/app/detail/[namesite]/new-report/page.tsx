"use client";

import { getQuestionsOnline } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, usePathname } from "next/navigation";
import { 
  ArrowLeft, 
  User, 
  ChevronRight, 
  ShieldCheck, 
  AlertCircle 
} from "lucide-react";
import Image from "next/image";
import MainContent from "./MainContent";
import StickyFooter from "./Footer";

export async function getCurrentUser() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return {
    email: user.email ?? '',
    role: user.user_metadata?.role ?? 'steward',
    name: user.user_metadata?.full_name ?? '',
    avatar: user.user_metadata?.avatar_url ?? '',
  }
}


interface Question {
  id: number;
  title: string | null;
  text: string | null;
  question_type: string;
  section: number;
  answers: any[];
}



export default function NewReportPage() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const namesite = decodeURIComponent(params.namesite as string);
  
  const [hasAccepted, setHasAccepted] = useState(false);
  const [showVerification, setShowVerification] = useState(true);
  const [verificationText, setVerificationText] = useState("");
  const [responses, setResponses] = useState<Record<number, any>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentUser, setCurrentUser] = useState<{ email: string; role: string; name:string; avatar:string } | null>(null);

    useEffect(() => {
      const fetchUser = async () => {
        try {
          const user = await getCurrentUser();
          setCurrentUser(user);
        } catch (err) {
          setCurrentUser(null);
        }
      };
      fetchUser();
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

  const requiredPhrase = "I am not a volunteer of SAPAA";
  const isVerificationValid = verificationText.trim() === requiredPhrase;
  const canProceed = isVerificationValid && hasAccepted;

  const handleResponsesChange = (newResponses: Record<number, any>) => {
    setResponses(newResponses);
  };

  const handleSubmit = () => {

  };

  return (


    
    <div className={`min-h-screen bg-[#F7F2EA] flex flex-col ${showVerification ? 'overflow-hidden max-h-screen' : ''}`}>
      
      {/* --- VERIFICATION POPUP --- */}
      {showVerification && (
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
      <MainContent onResponsesChange={handleResponsesChange} />

      {/* --- STICKY FOOTER --- */}
      <StickyFooter 
        questions={questions}
        responses={responses}
        onSubmit={handleSubmit}
      />
    </div>
  );
}