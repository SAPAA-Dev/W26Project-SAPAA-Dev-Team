const LABELS = ['Poor', 'Fair', 'Good', 'Excellent'];

/** Score (1 poor to 4 excellent, may be an average) to a whole step 1-4. */
const step = (score: number) => Math.min(4, Math.max(1, Math.round(score)));

/** Average naturalness (1 poor to 4 excellent) as a word. */
export const naturalLabel = (score: number | null) => (score === null ? 'No score yet' : LABELS[step(score) - 1]);

/**
 * The one naturalness colour scale, indexed by score - 1 (Poor .. Excellent): a forest ramp from pale to deep
 * (--nat-1..4 in forest.css). Never the status colours. Always pair it with the word from naturalLabel.
 */
export const NATURALNESS_COLOR = ['var(--nat-1)', 'var(--nat-2)', 'var(--nat-3)', 'var(--nat-4)'] as const;

/** Colour for a score, or null when unrated. */
export const naturalColor = (score: number | null) => (score === null ? null : NATURALNESS_COLOR[step(score) - 1]);

/** Four-step bar, Poor to Excellent. One hue on purpose: the count of filled steps and the word carry the meaning. */
export function NaturalBar({ score, tone = 'light' }: { score: number | null; tone?: 'light' | 'dark' }) {
  const level = score === null ? 0 : step(score);
  const on = tone === 'dark' ? 'bg-[var(--birch)]' : 'bg-[var(--forest)]';
  const off = tone === 'dark' ? 'bg-[rgba(244,241,232,0.2)]' : 'bg-[var(--line)]';
  return (
    <span
      role="meter"
      aria-label="Naturalness"
      aria-valuemin={1}
      aria-valuemax={4}
      aria-valuenow={score ?? undefined}
      aria-valuetext={score === null ? 'No score yet' : `${naturalLabel(score)}, ${score.toFixed(1)} of 4`}
      className="inline-flex gap-[3px]"
    >
      {[1, 2, 3, 4].map((i) => (
        <span key={i} aria-hidden className={`h-2 w-4 rounded-full ${i <= level ? on : off}`} />
      ))}
    </span>
  );
}
