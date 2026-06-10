export const GYMTWIN_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://gymtwin-ai.vercel.app";

export const GYMTWIN_SUPPORT_EMAIL = "adonyluisflorencio@gmail.com";
export const GYMTWIN_SUPPORT_URL = `${GYMTWIN_SITE_URL}/support`;
export const GYMTWIN_PRIVACY_PATH = "/privacy";
export const GYMTWIN_TERMS_PATH = "/terms";

export function buildSupportMailto(subject: string, body?: string): string {
  const params = new URLSearchParams({ subject });
  if (body) {
    params.set("body", body);
  }
  return `mailto:${GYMTWIN_SUPPORT_EMAIL}?${params.toString()}`;
}
