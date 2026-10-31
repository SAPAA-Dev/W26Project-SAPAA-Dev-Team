import { act, renderHook, waitFor } from '@testing-library/react';
import { invalidate, prefetch, useApi } from '@/app/v2/_lib/useApi';
jest.mock('@/lib/api/v1/client', () => ({ freshReads: jest.fn() }));

it('hides the previous record when the request key changes and refreshes after invalidation', async () => {
  const first = jest.fn().mockResolvedValue('first record');
  let finish: (value: string) => void = () => {};
  const second = jest.fn(() => new Promise<string>((resolve) => { finish = resolve; }));
  const view = renderHook(({ key }) => useApi(key, key === 'hook:first' ? first : second), { initialProps: { key: 'hook:first' } });
  await waitFor(() => expect(view.result.current.data).toBe('first record'));
  view.rerender({ key: 'hook:second' });
  expect(view.result.current.data).toBeUndefined();
  await act(async () => finish('second record'));
  expect(view.result.current.data).toBe('second record');
  act(() => invalidate('hook:second'));
  expect(second).toHaveBeenCalledTimes(2);
  await act(async () => finish('updated record'));
  expect(view.result.current.data).toBe('updated record');
  view.unmount();
});

it('joins a prefetched read, reports errors, and retries without keeping the old error', async () => {
  const fetcher = jest.fn().mockResolvedValue('prefetched');
  prefetch('hook:prefetch', fetcher);
  const cached = renderHook(() => useApi('hook:prefetch', fetcher));
  await waitFor(() => expect(cached.result.current.data).toBe('prefetched'));
  expect(fetcher).toHaveBeenCalledTimes(1);
  prefetch('hook:prefetch', fetcher);
  expect(fetcher).toHaveBeenCalledTimes(1);
  const retry = jest.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValue('recovered');
  const failed = renderHook(() => useApi('hook:retry', retry));
  await waitFor(() => expect(failed.result.current.error?.message).toBe('Offline'));
  act(() => failed.result.current.refetch());
  await waitFor(() => expect(failed.result.current.data).toBe('recovered'));
  expect(failed.result.current.error).toBeNull();
  cached.unmount();
  failed.unmount();
});


it('reuses completed reads for 30 seconds and refreshes expired data', async () => {
  let now = Date.now();
  const clock = jest.spyOn(Date, 'now').mockImplementation(() => now);
  const fetcher = jest.fn().mockResolvedValue('cached');
  const first = renderHook(() => useApi('ttl:record', fetcher));
  await waitFor(() => expect(first.result.current.data).toBe('cached'));
  first.unmount();
  const second = renderHook(() => useApi('ttl:record', fetcher));
  await waitFor(() => expect(second.result.current.data).toBe('cached'));
  expect(fetcher).toHaveBeenCalledTimes(1);
  second.unmount();
  now += 30_001;
  fetcher.mockResolvedValue('fresh');
  const third = renderHook(() => useApi('ttl:record', fetcher));
  await waitFor(() => expect(third.result.current.data).toBe('fresh'));
  expect(fetcher).toHaveBeenCalledTimes(2);
  third.unmount();
  clock.mockRestore();
});

it('does not reuse a pending response from before a write', async () => {
  let old: (value: string) => void = () => {};
  let updated: (value: string) => void = () => {};
  const fetcher = jest.fn()
    .mockImplementationOnce(() => new Promise<string>((resolve) => { old = resolve; }))
    .mockImplementationOnce(() => new Promise<string>((resolve) => { updated = resolve; }));
  const view = renderHook(() => useApi('race:record', fetcher));
  act(() => invalidate('race:record'));
  expect(fetcher).toHaveBeenCalledTimes(2);
  await act(async () => updated('after write'));
  expect(view.result.current.data).toBe('after write');
  await act(async () => old('before write'));
  expect(view.result.current.data).toBe('after write');
  view.unmount();
  const next = renderHook(() => useApi('race:record', fetcher));
  await waitFor(() => expect(next.result.current.data).toBe('after write'));
  expect(fetcher).toHaveBeenCalledTimes(2);
  next.unmount();
});

it('retries a failed intent prefetch when its screen opens', async () => {
  const fetcher = jest.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValue('available');
  await act(async () => prefetch('intent:retry', fetcher));
  const view = renderHook(() => useApi('intent:retry', fetcher));
  await waitFor(() => expect(view.result.current.data).toBe('available'));
  expect(fetcher).toHaveBeenCalledTimes(2);
  view.unmount();
});
