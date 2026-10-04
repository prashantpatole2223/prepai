// In-memory rate limiter: 10 requests per minute per user (SPEC Section 9)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkAiRateLimit(userId: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = requestCounts.get(userId);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(userId, { count: 1, resetAt: now + 60 * 1000 });
    return { allowed: true };
  }

  if (entry.count >= 10) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true };
}
