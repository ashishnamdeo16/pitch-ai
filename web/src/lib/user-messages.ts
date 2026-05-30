/**
 * Centralized user-facing error messages.
 * Technical details stay in console via logDevError().
 */

export const USER_MESSAGES = {
  generic:
    "Something unexpected happened. Please try again.",
  network:
    "Connection issue detected. Please check your internet connection and try again.",
  server:
    "Our servers are temporarily unavailable. Please try again in a few minutes.",
  unauthorized: "Please sign in to continue.",
  rateLimited: "Too many requests. Please wait a minute and try again.",
  notFound:
    "We couldn't find that resource. It may have been deleted.",
  boundary:
    "This page ran into a problem. Please try again. If it keeps happening, refresh the page.",
} as const;

export function logDevError(context: string, error: unknown): void {
  console.error(`[${context}]`, error);
}

export const EMAIL_NOT_CONFIRMED_MESSAGE =
  "Please confirm your email before signing in. Check your inbox (and spam folder) for the confirmation link.";

export function isEmailNotConfirmed(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("email not confirmed") ||
    m.includes("email_not_confirmed") ||
    m.includes("email address not confirmed")
  );
}

export function mapSupabaseAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "Unable to sign in. Please check your email and password.";
  }
  if (isEmailNotConfirmed(message)) {
    return EMAIL_NOT_CONFIRMED_MESSAGE;
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (m.includes("password") && m.includes("6")) {
    return "Password must be at least 6 characters.";
  }
  if (m.includes("valid email") || m.includes("invalid email")) {
    return "Please enter a valid email address.";
  }
  if (m.includes("signup is disabled")) {
    return "New sign-ups are currently disabled. Please contact support.";
  }
  if (m.includes("rate limit")) {
    return USER_MESSAGES.rateLimited;
  }

  return "Unable to complete sign-in. Please try again.";
}

const API_ERROR_MAP: Record<string, string> = {
  Unauthorized: USER_MESSAGES.unauthorized,
  "Rate limited": USER_MESSAGES.rateLimited,
  "Not found": USER_MESSAGES.notFound,
  "Server error": USER_MESSAGES.server,
  "No audio file":
    "No audio was received. Please record again and retry.",
  "Transcription failed":
    "We couldn't transcribe your audio. Please try again.",
  "sessionId required":
    "Session information is missing. Please start a new practice session.",
  "User not found":
    "Your account wasn't found. Please sign out and sign in again.",
  "Session not found":
    "That practice session wasn't found. Start a new session from Practice.",
  "Invalid status": "That session status isn't valid.",
  "Invalid mode": "That practice mode isn't supported.",
};

export function mapApiErrorBody(
  body: { error?: string; message?: string } | null,
  status: number
): string {
  if (body?.message && typeof body.message === "string") {
    return body.message;
  }
  if (body?.error && typeof body.error === "string") {
    return API_ERROR_MAP[body.error] ?? body.error;
  }
  if (status === 401) return USER_MESSAGES.unauthorized;
  if (status === 429) return USER_MESSAGES.rateLimited;
  if (status === 404) return USER_MESSAGES.notFound;
  if (status >= 500) return USER_MESSAGES.server;
  if (status === 0) return USER_MESSAGES.network;
  return USER_MESSAGES.generic;
}

export async function parseApiError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string; message?: string };
    return mapApiErrorBody(body, res.status);
  } catch {
    return mapApiErrorBody(null, res.status);
  }
}

export function mapWsSocketError(
  code?: string,
  fallbackMessage?: string
): string {
  switch (code) {
    case "AUTH_REQUIRED":
      return "Session expired. Please refresh and sign in again.";
    case "AUTH_INVALID":
      return "Unable to verify your session. Please refresh and try again.";
    case "RATE_LIMIT":
      return "You're sending updates too quickly. Pause for a moment, then continue.";
    default:
      if (fallbackMessage && !isTechnicalMessage(fallbackMessage)) {
        return fallbackMessage;
      }
      return "Connection issue with the live coach. Check your internet and try again.";
  }
}

export function mapSpeechError(error: string): string {
  switch (error) {
    case "not-allowed":
      return "Microphone access is required. Enable it in your browser settings and try again.";
    case "no-speech":
      return ""; // not user-facing
    case "network":
      return USER_MESSAGES.network;
    case "aborted":
      return "";
    default:
      if (error === "Microphone permission denied") {
        return "Microphone access is required. Enable it in your browser settings and try again.";
      }
      if (error === "Speech recognition not supported") {
        return "Speech recognition isn't supported in this browser. Try Chrome, Edge, or Safari on desktop.";
      }
      if (error === "Transcription failed") {
        return "We couldn't transcribe that audio clip. Please check your connection and keep speaking.";
      }
      if (error === "Audio recording error") {
        return "Audio recording stopped unexpectedly. Please restart your practice session.";
      }
      if (isTechnicalMessage(error)) {
        return USER_MESSAGES.generic;
      }
      return error;
  }
}

function isTechnicalMessage(msg: string): boolean {
  return (
    /^(error|failed|internal|undefined|null)/i.test(msg) ||
    msg.includes("stack") ||
    msg.length > 120
  );
}

/** User-facing API error strings (same semantics, clearer copy). */
export const API_USER_ERRORS = {
  unauthorized: USER_MESSAGES.unauthorized,
  rateLimited: USER_MESSAGES.rateLimited,
  notFound: USER_MESSAGES.notFound,
  server: USER_MESSAGES.server,
  noAudio:
    "No audio was received. Please record again and retry.",
  transcriptionFailed:
    "We couldn't transcribe your audio. Please try again.",
  sessionIdRequired:
    "Session information is missing. Please start a new practice session.",
  userNotFound:
    "Your account wasn't found. Please sign out and sign in again.",
  sessionNotFound:
    "That practice session wasn't found. Start a new session from Practice.",
  invalidStatus: "That session status isn't valid.",
  invalidMode: "That practice mode isn't supported.",
} as const;
