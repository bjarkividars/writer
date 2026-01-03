export function isMobileUserAgent(userAgent: string | null) {
  if (!userAgent) return false;
  return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent
  );
}
