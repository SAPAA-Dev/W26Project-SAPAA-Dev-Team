'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, MotionConfig } from 'motion/react';
import MotionProvider from '@/app/v2/_lib/MotionProvider';
import * as m from 'motion/react-m';
import { Check, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import MarkdownText from '@/components/MarkdownText';
import { api } from '@/lib/api/v1/client';
import type { FormQuestion, FormSection, Me } from '@/lib/api/v1/types';
import { invalidate, useApi } from '@/app/v2/_lib/useApi';
import { clearDraft, readDraft, writeDraft, type Draft, type DraftAnswer } from '@/app/v2/_components/flows/drafts';
import { questionNumber, since, siteHref, todayLocal } from '@/app/v2/_components/flows/format';
import { ErrorState, Eyebrow, Sheet, btn, useEdgeFade, useNow } from '@/app/v2/_components/flows/ui';
import { QuestionCard, autofillOf, isAnswered, isOtherOption, photoProblem, type LocalPhoto } from './Questions';
import { ActionBar, ReviewStep, SafetyStep, SuccessScreen, type Issue } from './Steps';

type Answers = Record<string, DraftAnswer>;

function decode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export default function InspectPage() {
  const slug = decode(useParams<{ slug: string }>().slug);
  const router = useRouter();
  const form = useApi('form', api.form);
  const site = useApi(`site:${slug}`, () => api.site(slug));
  const me = useApi('me', api.me);
  const leave = () => router.push(siteHref(slug));

  const error = form.error ?? site.error;
  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 pt-4 md:px-8">
        <button type="button" onClick={leave} aria-label="Close" className="-ml-2 grid size-11 place-items-center rounded-full">
          <X size={24} aria-hidden />
        </button>
        <div className="mt-6">
          <ErrorState
            title={form.error ? 'The inspection form did not load' : 'This site did not load'}
            error={error}
            onRetry={() => {
              if (form.error) form.refetch();
              if (site.error) site.refetch();
            }}
          />
        </div>
      </main>
    );
  }

  if (!form.data || !site.data) {
    return (
      <div aria-busy="true">
        <span className="sr-only" role="status">
          Loading the inspection form
        </span>
        <div className="h-[132px] bg-[var(--canopy)]" />
        <div className="mx-auto max-w-3xl animate-pulse space-y-4 px-4 pt-6 md:px-8">
          <div className="h-3 w-24 rounded bg-[var(--bg-sunken)]" />
          <div className="h-7 w-2/3 rounded bg-[var(--bg-sunken)]" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 rounded-[var(--radius-l)] bg-[var(--bg-sunken)]" />
          ))}
        </div>
      </div>
    );
  }

  const sections = form.data.filter((s) => s.questions.length > 0);
  return (
    <MotionProvider>
      <Inspection key={slug} slug={slug} sections={sections} siteName={site.data.name} me={me.data} onLeave={leave} />
    </MotionProvider>
  );
}

function Inspection({
  slug,
  sections,
  siteName,
  me,
  onLeave,
}: {
  slug: string;
  sections: FormSection[];
  siteName: string;
  me: Me | undefined;
  onLeave: () => void;
}) {
  const count = sections.length;
  const [today] = useState(todayLocal);
  const [restored] = useState(() => readDraft(slug));
  const [answers, setAnswers] = useState<Answers>(restored?.answers ?? {});
  const [accepted, setAccepted] = useState(restored?.accepted === true);
  const [index, setIndex] = useState(() => Math.min(Math.max(restored?.sectionIndex ?? 0, 0), count));
  const [dir, setDir] = useState(1);
  const [visited, setVisited] = useState(() => new Set(Array.from({ length: index + 1 }, (_, i) => i)));
  const [focus, setFocus] = useState<'heading' | number | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(restored?.updatedAt ?? null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [photos, setPhotos] = useState<Record<number, LocalPhoto[]>>({});
  const photosRef = useRef(photos);
  const [confirmClose, setConfirmClose] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: number; inspectionNo: string } | null>(null);
  const onReview = index === count;

  // Autofill is derived, not stored: the draft only holds what the steward touched (plus what was showing when they did).
  const defaults = useMemo(() => {
    const from: Record<string, string | null | undefined> = {
      user_email: me?.email,
      user_name: me?.person?.name,
      visit_date: today,
      site_name: siteName,
    };
    const out: Answers = {};
    for (const s of sections)
      for (const q of s.questions) {
        const fill = autofillOf(q);
        const v = q.type === 'site_select' ? siteName : fill ? from[fill] : null;
        if (v) out[q.id] = v;
      }
    return out;
  }, [sections, me, siteName, today]);
  const values: Answers = useMemo(() => ({ ...defaults, ...answers }), [defaults, answers]);

  const photoCount = Object.values(photos).reduce((n, l) => n + l.length, 0);
  const done = (q: FormQuestion) => (q.type === 'image' ? (photos[q.id]?.length ?? 0) > 0 : isAnswered(values[q.id]));
  const sectionStats = sections.map((s) => ({
    title: s.title,
    total: s.questions.length,
    answered: s.questions.filter(done).length,
    left: s.questions.filter((q) => q.required && !done(q)).length,
  }));

  const issues: Issue[] = [];
  sections.forEach((s, si) =>
    s.questions.forEach((q) => {
      const { text } = questionNumber(q.title, q.key);
      const add = (message: string, n = 0) =>
        issues.push({ key: `${q.id}-${n}-${message}`, sectionIndex: si, questionId: q.id, title: text, section: s.title, message });
      if (q.required && !done(q)) add(q.type === 'image' ? 'Add at least one photo' : 'Needs an answer');
      const v = values[q.id];
      if (q.type === 'date' && typeof v === 'string' && v > today) add('The date is in the future');
      (photos[q.id] ?? []).forEach((p, i) => {
        const problem = photoProblem(p, today);
        if (problem) add(`Photo ${i + 1}: ${problem}`, i + 1);
      });
    }),
  );
  // Inline errors appear once the steward has reached the review step.
  const showErrors = visited.has(count);
  const errorFor = (q: FormQuestion) => {
    if (!showErrors) return null;
    if (q.required && !done(q)) return q.type === 'image' ? 'Add at least one photo.' : 'This question needs an answer.';
    if (q.type === 'date' && typeof values[q.id] === 'string' && (values[q.id] as string) > today) return 'The date is in the future.';
    return null;
  };

  const persist = (next: { answers?: Answers; index?: number }) => {
    const draft: Draft = {
      siteName,
      sectionIndex: Math.min(next.index ?? index, count - 1),
      sectionCount: count,
      answers: { ...defaults, ...(next.answers ?? answers) },
      accepted: true,
      updatedAt: Date.now(),
    };
    const ok = writeDraft(slug, draft);
    setSaveFailed(!ok);
    if (ok) setSavedAt(draft.updatedAt);
  };

  const setAnswer = (key: string, v: DraftAnswer) => {
    const next = { ...answers, [key]: v };
    setAnswers(next);
    setDirty(true);
    persist({ answers: next });
  };

  const setPhotosFor = (qid: number, list: LocalPhoto[]) => {
    const next = { ...photos, [qid]: list };
    photosRef.current = next;
    setPhotos(next);
  };

  const go = (to: number, target: 'heading' | number = 'heading') => {
    setDir(to >= index ? 1 : -1);
    setIndex(to);
    setVisited((v) => new Set(v).add(to));
    setFocus(target);
    if (savedAt !== null) persist({ index: to });
  };

  const close = () => (dirty || photoCount ? setConfirmClose(true) : onLeave());

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const out: Record<number, string | string[]> = {};
    const comments: Record<number, string> = {};
    for (const s of sections)
      for (const q of s.questions) {
        const v = values[q.id];
        if (q.type === 'image' || !isAnswered(v)) continue;
        out[q.id] = typeof v === 'boolean' ? 'true' : Array.isArray(v) ? v : v.trim();
        const other = values[`${q.id}_other`];
        if (Array.isArray(v) && v.some(isOtherOption) && typeof other === 'string' && other.trim()) comments[q.id] = other.trim();
      }
    try {
      const res = await api.submitReport({ siteSlug: slug, answers: out, comments });
      clearDraft(slug);
      // Prefixes cover 'sites', 'site:<slug>', 'reports', 'report:<id>' and the season count.
      invalidate('site');
      invalidate('report');
      invalidate('me');
      invalidate('profile');
      Object.values(photosRef.current).flat().forEach((p) => URL.revokeObjectURL(p.url));
      setResult(res);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  // Local previews are not part of the draft, so warn before the tab closes with photos in it.
  const hasPhotos = photoCount > 0;
  useEffect(() => {
    if (!hasPhotos) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasPhotos]);

  useEffect(() => {
    const ref = photosRef;
    return () => Object.values(ref.current).flat().forEach((p) => URL.revokeObjectURL(p.url));
  }, []);

  if (result) return <SuccessScreen inspectionNo={result.inspectionNo} reportId={result.id} siteName={siteName} slug={slug} />;

  if (!accepted) {
    return (
      <SafetyStep
        siteName={siteName}
        onCancel={onLeave}
        onStart={() => {
          setAccepted(true);
          setFocus('heading');
        }}
      />
    );
  }

  const nextTitle = index + 1 < count ? sections[index + 1].title : 'Review';
  const firstIssue = issues[0];

  return (
    <MotionConfig reducedMotion="user">
      <Header
        siteName={siteName}
        sections={sections}
        stats={sectionStats}
        index={index}
        savedAt={savedAt}
        saveFailed={saveFailed}
        onClose={close}
        onGo={go}
      />

      <main className="mx-auto max-w-3xl overflow-x-clip px-4 pt-6 md:px-8" style={{ paddingBottom: 'calc(112px + var(--safe-b))' }}>
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <m.div
            key={index}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: d * 32, opacity: 0 }),
              center: { x: 0, opacity: 1, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
              exit: (d: number) => ({ x: d * -32, opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <Step focus={focus}>
              {(heading) =>
                onReview ? (
                  <>
                    <Eyebrow light>Last step</Eyebrow>
                    <h2 ref={heading} tabIndex={-1} className="mt-1 text-[28px] leading-tight font-bold outline-none">
                      Review and submit
                    </h2>
                    <ReviewStep
                      issues={issues}
                      sections={sectionStats}
                      answered={sectionStats.reduce((n, s) => n + s.answered, 0)}
                      total={sectionStats.reduce((n, s) => n + s.total, 0)}
                      submitError={submitError}
                      onJump={(si, qid) => go(si, qid ?? 'heading')}
                    />
                  </>
                ) : (
                  <>
                    <Eyebrow light>
                      Section <span className="num">{index + 1}</span> of <span className="num">{count}</span>
                    </Eyebrow>
                    <h2 ref={heading} tabIndex={-1} className="mt-1 text-[28px] leading-tight font-bold outline-none">
                      {sections[index].title}
                    </h2>
                    {sections[index].description && (
                      <div className="mt-2 text-[16px] leading-relaxed text-[var(--ink-2)]">
                        <MarkdownText content={sections[index].description} />
                      </div>
                    )}
                    <div className="mt-6 space-y-4">
                      {sections[index].questions.map((q) => (
                        <QuestionCard
                          key={q.id}
                          q={q}
                          value={values[q.id]}
                          other={typeof values[`${q.id}_other`] === 'string' ? (values[`${q.id}_other`] as string) : ''}
                          onChange={(v) => setAnswer(String(q.id), v)}
                          onOther={(v) => setAnswer(`${q.id}_other`, v)}
                          photos={photos[q.id] ?? []}
                          onPhotos={(list) => setPhotosFor(q.id, list)}
                          siteName={siteName}
                          today={today}
                          photographer={me?.person?.name ?? ''}
                          autofilled={answers[q.id] === undefined && defaults[q.id] !== undefined}
                          error={errorFor(q)}
                          showErrors={showErrors}
                        />
                      ))}
                    </div>
                  </>
                )
              }
            </Step>
          </m.div>
        </AnimatePresence>
      </main>

      <ActionBar>
        {index > 0 && (
          <button type="button" onClick={() => go(index - 1)} className={`${btn.secondary} shrink-0 px-4`}>
            <ChevronLeft size={20} aria-hidden />
            Back
          </button>
        )}
        {!onReview ? (
          <button type="button" onClick={() => go(index + 1)} className={`${btn.primary} min-w-0 flex-1`}>
            <span className="truncate">Next: {nextTitle}</span>
            <ChevronRight size={20} aria-hidden className="shrink-0" />
          </button>
        ) : firstIssue ? (
          <button
            type="button"
            onClick={() => go(firstIssue.sectionIndex, firstIssue.questionId)}
            className={`${btn.primary} min-w-0 flex-1`}
          >
            <span className="truncate">Answer: {firstIssue.title}</span>
            <ChevronRight size={20} aria-hidden className="shrink-0" />
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={submitting} className={`${btn.primary} min-w-0 flex-1`}>
            {submitting ? (
              <>
                <Loader2 size={20} aria-hidden className="animate-spin" />
                Submitting…
              </>
            ) : (
              'Submit report'
            )}
          </button>
        )}
      </ActionBar>

      <Sheet
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        title="Leave this inspection?"
        description={
          photoCount
            ? `Your answers are saved on this device and you can finish later. ${photoCount === 1 ? 'The photo is' : `The ${photoCount} photos are`} not kept in the draft.`
            : 'Your answers are saved on this device. You can finish later from the site page.'
        }
      >
        <div className="flex flex-col gap-3 pt-2">
          <button type="button" onClick={onLeave} className={btn.primary}>
            Save draft and leave
          </button>
          <button type="button" onClick={() => setConfirmClose(false)} className={btn.secondary}>
            Keep inspecting
          </button>
          <button
            type="button"
            onClick={() => {
              clearDraft(slug);
              onLeave();
            }}
            className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-m)] px-5 text-[16px] font-semibold text-[var(--clay-ink)]"
          >
            Discard draft
          </button>
        </div>
      </Sheet>
    </MotionConfig>
  );
}

/** Mounts once per step: moves focus to the heading (or a question jumped to from review). */
function Step({ focus, children }: { focus: 'heading' | number | null; children: (heading: React.Ref<HTMLHeadingElement>) => React.ReactNode }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focus === null) return;
    if (focus === 'heading') {
      window.scrollTo({ top: 0 });
      heading.current?.focus({ preventScroll: true });
      return;
    }
    const card = document.getElementById(`q-${focus}`);
    card?.scrollIntoView({ block: 'start' });
    card?.querySelector<HTMLElement>('input:not([type=hidden]), textarea, label[for]')?.focus({ preventScroll: true });
    // Runs on mount only: each step is keyed, so it mounts fresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <>{children(heading)}</>;
}

function Header({
  siteName,
  sections,
  stats,
  index,
  savedAt,
  saveFailed,
  onClose,
  onGo,
}: {
  siteName: string;
  sections: FormSection[];
  stats: { left: number; answered: number }[];
  index: number;
  savedAt: number | null;
  saveFailed: boolean;
  onClose: () => void;
  onGo: (i: number) => void;
}) {
  const current = useRef<HTMLButtonElement>(null);
  // Braces matter: newer Chrome returns a Promise from scrollIntoView, and React would call it as a cleanup.
  useEffect(() => {
    current.current?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [index]);
  const count = sections.length;
  const rail = useEdgeFade<HTMLOListElement>();

  const chip = (on: boolean) =>
    `press flex h-11 items-center gap-1.5 rounded-full border px-4 text-[14px] font-semibold whitespace-nowrap ${
      on
        ? 'border-[var(--honey)] bg-[var(--honey)] text-[var(--canopy)]'
        : 'border-[var(--forest-2)] text-[var(--sage)] hover:border-[var(--sage)] hover:text-[var(--birch)]'
    }`;

  return (
    <header className="sticky top-0 z-30 bg-[var(--canopy)] text-[var(--birch)]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-2 pt-2 md:px-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close inspection"
          className="press grid size-11 shrink-0 place-items-center rounded-full text-[var(--sage)] hover:bg-[var(--forest)] hover:text-[var(--birch)]"
        >
          <X size={22} aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] leading-tight font-bold">{siteName}</p>
          <SaveStatus savedAt={savedAt} failed={saveFailed} />
        </div>
      </div>
      <nav aria-label="Form sections" className="mx-auto max-w-3xl">
        <ol {...rail} className="edge-fade flex scroll-px-10 gap-2 overflow-x-auto overscroll-x-contain px-3 pt-2.5 pb-3 md:px-4">
          {sections.map((s, i) => {
            const { left, answered } = stats[i];
            const complete = left === 0 && answered > 0;
            const on = i === index;
            return (
              <li key={s.id} className="shrink-0">
                <button type="button" ref={on ? current : undefined} aria-current={on ? 'step' : undefined} onClick={() => onGo(i)} className={chip(on)}>
                  {complete && <Check size={15} strokeWidth={3} aria-hidden className={on ? '' : 'text-[var(--moss)]'} />}
                  {s.title}
                  {left > 0 && (
                    <span className={`num rounded-full px-1.5 py-0.5 text-[12px] font-bold ${on ? 'bg-[rgba(18,42,28,0.14)]' : 'bg-[var(--forest)] text-[var(--birch)]'}`}>
                      {left} left
                    </span>
                  )}
                  <span className="sr-only">{complete ? ', complete' : left ? ', required questions left' : ''}</span>
                </button>
              </li>
            );
          })}
          <li className="shrink-0">
            <button type="button" ref={index === count ? current : undefined} aria-current={index === count ? 'step' : undefined} onClick={() => onGo(count)} className={chip(index === count)}>
              Review
            </button>
          </li>
        </ol>
      </nav>
      <div aria-hidden className="h-[3px] bg-[var(--forest)]">
        <div
          className="h-full origin-left bg-[var(--honey)] transition-transform duration-[var(--dur-3)] ease-[var(--ease-out)]"
          style={{ transform: `scaleX(${(index + 1) / (count + 1)})` }}
        />
      </div>
    </header>
  );
}

function SaveStatus({ savedAt, failed }: { savedAt: number | null; failed: boolean }) {
  const now = useNow(savedAt ? 1000 : null);
  const text = failed
    ? 'Not saved: this device blocked storage'
    : savedAt
      ? `Saved on this device · ${since(now - savedAt)}`
      : 'Saves on this device as you go';
  return (
    <>
      <p aria-hidden className={`num truncate text-[13px] ${failed ? 'text-[var(--honey)]' : 'text-[var(--sage)]'}`}>
        {text}
      </p>
      <p className="sr-only" role="status">
        {failed ? 'Your draft could not be saved on this device.' : savedAt ? 'Draft saved on this device.' : ''}
      </p>
    </>
  );
}
