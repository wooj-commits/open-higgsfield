type Bucket = { count: number; resetAt: number };

const windows = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/** In-memory limiter for a single instance. Enough to stop casual stuffing of the sign-in form. */
export function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const bucket = windows.get(key);
  if (!bucket || bucket.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_ATTEMPTS;
}

export function resetAttempts(key: string): void {
  windows.delete(key);
}
