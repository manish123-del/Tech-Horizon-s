// simple in-memory rate limiter keyed by IP address. Not persistent but enough for demo.

type Entry = { count: number; firstRequest: number };
const map = new Map<string, Entry>();

/**
 * returns true if request should be allowed, false if rate limit exceeded
 */
export function checkRateLimit(ip: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const entry = map.get(ip);
  if (!entry) {
    map.set(ip, { count: 1, firstRequest: now });
    return true;
  }
  if (now - entry.firstRequest > windowMs) {
    map.set(ip, { count: 1, firstRequest: now });
    return true;
  }
  if (entry.count >= limit) {
    return false;
  }
  entry.count++;
  return true;
}
