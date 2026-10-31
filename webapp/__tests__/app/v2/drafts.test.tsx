import { renderHook } from '@testing-library/react';
import { readDraft, writeDraft, clearDraft, useDrafts, type Draft } from '@/app/v2/_components/flows/drafts';

it('keeps drafts private to their owner and leaves ownerless drafts unassigned', () => {
  localStorage.clear();
  const draft: Draft = { siteName: 'Park', sectionIndex: 0, sectionCount: 2, answers: { '1': 'Private' }, accepted: true, updatedAt: 100 };
  localStorage.setItem('boreal-draft:Park', JSON.stringify(draft));
  writeDraft('Park', draft, 'first');
  expect(readDraft('Park', 'first')).toEqual(draft);
  expect(readDraft('Park', 'second')).toBeNull();
  expect(renderHook(() => useDrafts('second')).result.current).toEqual([]);
  expect(renderHook(() => useDrafts()).result.current).toEqual([]);
  const view = renderHook(() => useDrafts('first'));
  expect(view.result.current).toEqual([{ ...draft, slug: 'Park' }]);
  view.unmount();
  clearDraft('Park', 'second');
  expect(readDraft('Park', 'first')).toEqual(draft);
  clearDraft('Park', 'first');
  expect(readDraft('Park', 'first')).toBeNull();
  expect(localStorage.getItem('boreal-draft:Park')).not.toBeNull();
});
