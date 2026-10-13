import { getReportQuestionKeyMap } from '@/lib/pdf/reportQueries';
import { createServerSupabase } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server', () => ({
  createServerSupabase: jest.fn(),
}));

describe('getReportQuestionKeyMap', () => {
  it('retries after a failed lookup instead of caching the failure', async () => {
    const lookup = jest
      .fn()
      .mockResolvedValueOnce({ data: null, error: { message: 'temporary outage' } })
      .mockResolvedValueOnce({ data: [{ 'question key': 'Q31_Naturalness', id: 31 }], error: null });
    const query: Record<string, jest.Mock> = { in: lookup };
    query.select = jest.fn(() => query);
    (createServerSupabase as jest.Mock).mockReturnValue({ from: jest.fn(() => query) });

    await expect(getReportQuestionKeyMap()).rejects.toThrow('temporary outage');
    await expect(getReportQuestionKeyMap()).resolves.toEqual({ Q31_Naturalness: 31 });
    // A success is cached, so a third call does not query again.
    await expect(getReportQuestionKeyMap()).resolves.toEqual({ Q31_Naturalness: 31 });
    expect(lookup).toHaveBeenCalledTimes(2);
  });
});
