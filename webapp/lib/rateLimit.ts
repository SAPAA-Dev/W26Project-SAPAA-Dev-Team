// ponytail: counters live in one server instance. A serverless host runs several, so the real limit is looser.
// Move the counters to a shared store (a Supabase table or Redis) if abuse shows up.
const attempts = new Map<string, number[]>();

export function isRateLimited(key: string, limit: number, windowMs: number, now: number = Date.now()): boolean {
  const recent = (attempts.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    attempts.set(key, recent);
    return true;
  }
  recent.push(now);
  attempts.set(key, recent);
  return false;
}

export function clearRateLimits(): void {
  attempts.clear();
}
