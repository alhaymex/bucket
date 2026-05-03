const BLOCKED_URL_PATTERNS = [
  /\/cdn-cgi\/challenge-platform/i,
  /\/cdn-cgi\/l\/chk_jschl/i,
  /\/sorry\/index/i,
  /\/challenge\//i,
  /\/captcha/i,
] as const;

const STRONG_BLOCKED_PAGE_PATTERNS = [
  /just a moment/i,
  /verify (that )?you are human/i,
  /are you a human/i,
  /attention required/i,
  /checking your browser/i,
  /checking if the site connection is secure/i,
  /please stand by/i,
  /enable javascript and cookies to continue/i,
  /access denied/i,
  /access to this page has been denied/i,
  /unusual traffic/i,
  /security check/i,
  /browser check/i,
  /cf-browser-verification/i,
  /challenge-platform/i,
  /g-recaptcha/i,
  /hcaptcha/i,
  /turnstile/i,
  /ddos-guard/i,
] as const;

const WEAK_BLOCKED_PAGE_PATTERNS = [
  /cloudflare/i,
  /ray id/i,
  /enable cookies/i,
  /enable javascript/i,
  /requires javascript/i,
  /bot detection/i,
  /automated requests/i,
] as const;

export const looksLikeBlockedPage = ({
  title,
  finalUrl,
  html,
  text,
}: {
  title?: string | null;
  finalUrl?: string | null;
  html?: string | null;
  text?: string | null;
}) => {
  if (
    finalUrl &&
    BLOCKED_URL_PATTERNS.some((pattern) => pattern.test(finalUrl))
  ) {
    return true;
  }

  const titleSignals = title ?? "";
  const bodySignals = `${html ?? ""}\n${text ?? ""}`.slice(0, 8000);

  if (
    STRONG_BLOCKED_PAGE_PATTERNS.some(
      (pattern) => pattern.test(titleSignals) || pattern.test(bodySignals),
    )
  ) {
    return true;
  }

  const weakSignalCount = WEAK_BLOCKED_PAGE_PATTERNS.filter(
    (pattern) => pattern.test(titleSignals) || pattern.test(bodySignals),
  ).length;

  return weakSignalCount >= 2;
};
