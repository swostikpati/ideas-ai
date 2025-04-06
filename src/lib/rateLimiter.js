const rateLimitMap = new Map();

export function rateLimit({ limit, windowMs }) {
  return function checkLimit(ip) {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, []);
    }

    // Filter out old timestamps
    const timestamps = rateLimitMap.get(ip).filter((ts) => ts > windowStart);
    timestamps.push(now);
    rateLimitMap.set(ip, timestamps);

    return timestamps.length <= limit;
  };
}
