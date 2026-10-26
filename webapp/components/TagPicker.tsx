'use client';

import { useId, useState } from 'react';
import { X } from 'lucide-react';
import {
  MAX_PROFILE_TAG_LENGTH,
  MAX_PROFILE_TAGS,
  matchExistingTag,
  suggestSimilarTags,
} from '@/lib/profileTags';

const OTHER = '__other__';

// 1.0.6: pick from the values that profiles already use, or choose Other to add a new one.
export default function TagPicker({ label, values, options, onChange }: {
  label: string;
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
}) {
  const selectId = useId();
  const [otherOpen, setOtherOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const available = options.filter((option) => !values.some((value) => value.toLowerCase() === option.toLowerCase()));
  const suggestions = suggestSimilarTags(available, typed);
  const full = values.length >= MAX_PROFILE_TAGS;

  function add(value: string) {
    const tag = matchExistingTag(options, value);
    if (!tag) return;
    if (tag.length > MAX_PROFILE_TAG_LENGTH) {
      setProblem(`Use no more than ${MAX_PROFILE_TAG_LENGTH} characters.`);
      return;
    }
    setProblem(null);
    if (!values.some((existing) => existing.toLowerCase() === tag.toLowerCase())) onChange([...values, tag]);
    setTyped('');
    setOtherOpen(false);
  }

  return (
    <fieldset className="text-sm font-semibold text-[#254431]">
      <legend>{label}</legend>
      {values.length > 0 && (
        <ul className="mt-1 flex flex-wrap gap-2" aria-label={`Chosen ${label.toLowerCase()}`}>
          {values.map((value) => (
            <li key={value} className="inline-flex items-center gap-1 rounded-full bg-[#E4EBE4] px-3 py-1 font-normal">
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                onClick={() => onChange(values.filter((existing) => existing !== value))}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <label htmlFor={selectId} className="sr-only">Add {label.toLowerCase()}</label>
      <select
        id={selectId}
        value=""
        disabled={full}
        onChange={(event) => {
          if (event.target.value === OTHER) setOtherOpen(true);
          else if (event.target.value) add(event.target.value);
        }}
        className="mt-1 block w-full rounded-lg border border-[#B9C8BC] px-3 py-2 font-normal"
      >
        <option value="">{full ? `Up to ${MAX_PROFILE_TAGS} ${label.toLowerCase()}` : 'Select…'}</option>
        {available.map((option) => <option key={option} value={option}>{option}</option>)}
        <option value={OTHER}>Other…</option>
      </select>
      {otherOpen && !full && (
        <div className="mt-2">
          <div className="flex gap-2">
            <input
              value={typed}
              maxLength={MAX_PROFILE_TAG_LENGTH}
              aria-label={`Other ${label.toLowerCase()}`}
              onChange={(event) => setTyped(event.target.value)}
              onKeyDown={(event) => {
                // Enter adds the value. It must not submit the whole profile form.
                if (event.key === 'Enter') { event.preventDefault(); add(typed); }
              }}
              className="block w-full rounded-lg border border-[#B9C8BC] px-3 py-2 font-normal"
            />
            <button type="button" onClick={() => add(typed)} disabled={!typed.trim()} className="rounded-lg bg-[#356B43] px-3 font-semibold text-white disabled:opacity-60">
              Add
            </button>
          </div>
          {suggestions.length > 0 && (
            <div className="mt-1 text-xs font-normal">
              Already used:{' '}
              {suggestions.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => add(suggestion)} className="mr-2 underline">
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {problem && <p role="alert" className="mt-1 text-xs font-medium text-red-700">{problem}</p>}
    </fieldset>
  );
}
