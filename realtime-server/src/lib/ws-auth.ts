import { createHmac, timingSafeEqual } from "crypto";

export interface WsTokenPayload {
  sessionId: string;
  userId: string;
  exp: number;
}

function getSecret(): string {
  return (
    process.env.WS_TOKEN_SECRET ||
    process.env.SESSION_SECRET ||
    "pitchpilot-dev-insecure"
  );
}

/** Verify HMAC-signed WS token issued by Next.js /api/ws/token */
export function verifyWsToken(token: string): WsTokenPayload | null {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;

    const expected = createHmac("sha256", getSecret())
      .update(body)
      .digest("base64url");

    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as WsTokenPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.sessionId || !payload.userId) return null;

    return payload;
  } catch {
    return null;
  }
}
