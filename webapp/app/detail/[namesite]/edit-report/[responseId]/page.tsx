"use client";

import {
  getQuestionsOnline,
  isSteward,
  getFormResponseById,
  updateSiteInspectionAnswers,
  getResponseOwnerId,
  getQuestionResponseType,
  updateAttachmentMetadata,
  insertInspectionAttachments,
  getSiteIdForResponse,
} from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Image from "next/image";
import MainContent, { ExistingAttachment, LocalImage } from "../../new-report/MainContent";
import StickyFooter from "../../new-report/Footer";

// ── Types ───────────────────────────────────────────────────────────────────

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

// ── Component ────────────────────────────────────────────────────────────────

export default function EditReportPage() {
  const params = useParams<{ namesite: string; responseId: string }>();
  const router = useRouter();
  const namesite = decodeURIComponent(params.namesite as string);
  const responseId = Number(params.responseId);

  const [responses, setResponses] = useState<Record<number, any>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    id?: string; email: string; role: string; name: string; avatar: string;
  } | null>(null);
  const [isStewardUser, setIsStewardUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Existing attachments (already in AWS — non-removable, metadata editable)
  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);
  // Track which existing attachments had their metadata changed so we only update those
  const [originalAttachmentMeta, setOriginalAttachmentMeta] = useState<
    Record<number, { caption: string | null; description: string | null }>
  >({});

  const [showRequiredPopup, setShowRequiredPopup] = useState(false);
  const [missingRequiredQuestionNumbers, setMissingRequiredQuestionNumbers] = useState<string[]>([]);
  const [siteId, setSiteId] = useState<number | null>(null);
  
  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
  
        const [user, questionsData, existingAnswers, siteImagesRes, siteRow] = await Promise.all([
          getCurrentUser(),
          getQuestionsOnline(),
          getFormResponseById(responseId),
          fetch(`/api/site-images?responseid=${responseId}`),
          getSiteIdForResponse(responseId),
        ]);
        
        setSiteId(siteRow);
        setCurrentUser(user);
        setQuestions(questionsData || []);
        setResponses(existingAnswers);
        console.log(questionsData);
        console.log(existingAnswers);
        const { items = [] } = await siteImagesRes.json();
  
        const hydrated: ExistingAttachment[] = items.map((a: any) => ({
          id:              a.id,
          question_id:     a.question_id ?? 0,
          storage_key:     a.storage_key ?? '',
          filename:        a.filename,
          content_type:    a.content_type,
          file_size_bytes: a.file_size_bytes,
          caption:         a.caption,
          description:     a.description,
          site_id:         a.site_id,
          previewUrl:      a.imageUrl,   // ← presigned GET URL from the route
        }));
  
        setExistingAttachments(hydrated);
  
        const metaSnapshot: Record<number, { caption: string | null; description: string | null }> = {};
        hydrated.forEach((a) => {
          metaSnapshot[a.id] = { caption: a.caption, description: a.description };
        });
        setOriginalAttachmentMeta(metaSnapshot);
  
        if (user?.email) {
          const stewardStatus = await isSteward(user.email);
          setIsStewardUser(stewardStatus);
        }
  
        const [ownerId, { data: { user: authUser } }] = await Promise.all([
          getResponseOwnerId(responseId),
          createClient().auth.getUser(),
        ]);
  
        setIsAuthorized(ownerId != null && authUser?.id != null && ownerId === authUser.id);
      } catch (err) {
        console.error('Error initializing edit page:', err);
      } finally {
        setIsLoading(false);
      }
    };
  
    init();
  }, [responseId]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const PRESIGN_ROUTE = "/api/s3/presign";

  async function getPresignedUrl(input: {
    filename: string;
    contentType: string;
    fileSize: number;
    siteId: number;
    responseId: number;
    questionId: number;
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
      throw new Error(err?.error || "Failed to get presigned URL");
    }
    return (await res.json()) as { uploadUrl: string; key: string };
  }

  async function uploadFileToS3(uploadUrl: string, file: File) {
    const u = new URL(uploadUrl);
    if (window.location.protocol === "https:" && u.protocol !== "https:") {
      throw new Error("Blocked: uploadUrl is not https (mixed content).");
    }
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      mode: "cors",
      body: file,
    });
    if (!putRes.ok) {
      const text = await putRes.text().catch(() => "");
      throw new Error(`S3 upload failed (${putRes.status}): ${text}`);
    }
  }

  const isAnswered = (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return value === true;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  };

  const buildQuestionNumberMap = (formQuestions: Question[]): Record<number, string> => {
    const map: Record<number, string> = {};
    for (const q of formQuestions) {
      const match = (q.title ?? '').match(/\(Q(\d+)\)/i);
      map[q.id] = match ? `Q${match[1]}` : `Question ${q.id}`;
    }
    return map;
  };

  // Returns the site_id for the current response (needed for S3 key + attachment insert)
  const getSiteId = async (): Promise<number | null> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('W26_form_responses')
      .select('site_id')
      .eq('id', responseId)
      .single();
    if (error || !data) return null;
    return (data as any).site_id ?? null;
  };

  // Upload a single local image to S3 via the presigned-URL API route.
  // Returns the S3 storage key on success.
  const uploadImageToS3 = async (
    localImage: LocalImage,
    questionId: number,
    siteId: number
  ): Promise<string> => {
    // 1. Get a presigned upload URL from our API route
    const res = await fetch('/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: localImage.file.name,
        contentType: localImage.file.type,
        fileSize: localImage.file.size,
        responseId,
        questionId,
        siteId,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to get upload URL');
    }

    const { uploadUrl, key } = await res.json();

    // 2. PUT the file directly to S3
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: localImage.file,
      headers: { 'Content-Type': localImage.file.type },
    });

    if (!putRes.ok) throw new Error('S3 upload failed');

    return key as string;
  };

  // ── Submit handler ────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    // 1. Required-fields check (exclude image questions — existing images count)
    const questionNumberMap = buildQuestionNumberMap(questions);
    const missingRequired = questions
      .filter((q) => {
        if (q.is_required !== true) return false;
        if (q.question_type.trim() === 'image') {
          const hasLocal = isAnswered(responses[q.id]);
          const hasExisting = existingAttachments.some((a) => a.question_id === q.id);
          return !hasLocal && !hasExisting;
        }
        return !isAnswered(responses[q.id]);
      })
      .map((q) => questionNumberMap[q.id] ?? `Question ${q.id}`);

    if (missingRequired.length > 0) {
      setMissingRequiredQuestionNumbers(missingRequired);
      setShowRequiredPopup(true);
      return;
    }

    setShowRequiredPopup(false);
    setMissingRequiredQuestionNumbers([]);
    setIsSaving(true);

    try {
      // 2. Persist regular (non-image) answers — same delete+reinsert logic as before
      const data = await getQuestionResponseType();
      console.log(data);
      const observationTypeMap = new Map(
        data.map((q) => [String(q.question_id), { obs_value: q.obs_value, obs_comm: q.obs_comm }])
      );

      const answersArray: SupabaseAnswerRow[] = [];

      for (const [questionId, answer] of Object.entries(responses)) {
        if (questionId.includes('_comm')) continue;

        // Skip image question responses — those are handled separately via W26_attachments
        const question = questions.find((q) => q.id === Number(questionId));
        if (question?.question_type.trim() === 'image') continue;

        const questionConfig = observationTypeMap.get(questionId);
        const isValueType = questionConfig?.obs_value == 1;
        const isCommType = questionConfig?.obs_comm == 1;

        if (Array.isArray(answer)) {
          answer.forEach((subAnswer: any) => {
            const isOther = subAnswer === 'Other';
            const commValue = isOther ? ((responses as Record<string, any>)[`${questionId}_comm`] ?? null) : null;
            answersArray.push({
              question_id: Number(questionId),
              obs_value: isValueType ? String(subAnswer) : null,
              obs_comm: isOther ? commValue : isCommType ? String(subAnswer) : null,
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

      // 3. Update metadata for any existing attachments that changed
      const metadataUpdates: Promise<void>[] = [];
      for (const attachment of existingAttachments) {
        const original = originalAttachmentMeta[attachment.id];
        const captionChanged = original?.caption !== attachment.caption;
        const descriptionChanged = original?.description !== attachment.description;
        if (captionChanged || descriptionChanged) {
          metadataUpdates.push(
            updateAttachmentMetadata(attachment.id, {
              caption: attachment.caption,
              description: attachment.description,
            })
          );
        }
      }
      await Promise.all(metadataUpdates);

      // Step 4 — upload new local images using the same flow as new-report
      if (siteId) {
        const imageQuestions = questions.filter((q) => q.question_type.trim() === 'image');

        for (const imageQuestion of imageQuestions) {
          const imageList = Array.isArray(responses[imageQuestion.id])
            ? (responses[imageQuestion.id] as LocalImage[]).filter((img) => img.file instanceof File)
            : [];

          if (imageList.length === 0) continue;

          const attachmentRows = [];

          for (const image of imageList) {
            const { uploadUrl, key } = await getPresignedUrl({
              filename: image.file.name,
              contentType: image.file.type,
              fileSize: image.file.size,
              responseId,
              questionId: imageQuestion.id,
              siteId,
            });

            await uploadFileToS3(uploadUrl, image.file);

            attachmentRows.push({
              response_id: responseId,
              question_id: imageQuestion.id,
              site_id: siteId,
              storage_key: key,
              filename: image.file.name,
              content_type: image.file.type,
              file_size_bytes: image.file.size,
              caption: image.caption?.trim() || null,
              description: image.description?.trim() || null,
            });
          }

          if (attachmentRows.length > 0) {
            await insertInspectionAttachments(attachmentRows);
          }
        }
      }
      router.push(`/sites?edited=true`);
    } catch (error) {
      console.error('Error saving report:', error);
      // Optionally surface an error toast here
    } finally {
      setIsSaving(false);
    }
  };

  // ── Loading / auth guards ─────────────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────────

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
      <header className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto">

        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[#86A98A] hover:text-white transition-colors mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Site</span>
        </button>

        <div className="flex items-start justify-between">

          {/* Left: icon + form info */}
          <div className="flex items-start gap-4">
            <Image
              src="/images/sapaa-icon-white.png"
              alt="SAPAA"
              width={140}
              height={140}
              priority
              className="h-16 w-auto flex-shrink-0 opacity-100 mt-1"
            />
            <div>
              <h1 className="text-3xl font-bold mt-2.5">Edit Inspection Report</h1>
              <div className="text-[#E4EBE4]">
                <span className="text-base">{namesite}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

      {/* Form — same MainContent as new-report, extended with existing-attachment props */}
      <MainContent
        responses={responses}
        onResponsesChange={setResponses}
        siteName={namesite}
        currentUser={currentUser}
        existingAttachments={existingAttachments}
        onExistingAttachmentsChange={setExistingAttachments}
      />

      <StickyFooter
        questions={questions}
        responses={responses}
        onSubmit={handleSubmit}
      />
    </div>
  );
}