import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createWsToken } from "@/lib/ws-token";
import { rateLimit } from "@/lib/redis";
import { API_USER_ERRORS } from "@/lib/user-messages";

/** Issue a short-lived signed token for WebSocket session:join */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: API_USER_ERRORS.unauthorized }, { status: 401 });
    }

    const rl = await rateLimit(`ws-token:${user.id}`, 60, 60);
    if (!rl.success) {
      return NextResponse.json({ error: API_USER_ERRORS.rateLimited }, { status: 429 });
    }

    const body = await request.json();
    const { sessionId } = body as { sessionId?: string };

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: API_USER_ERRORS.sessionIdRequired }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: API_USER_ERRORS.userNotFound }, { status: 404 });
    }

    const session = await prisma.pitchSession.findFirst({
      where: { id: sessionId, userId: dbUser.id },
      select: { id: true },
    });

    if (!session) {
      return NextResponse.json({ error: API_USER_ERRORS.sessionNotFound }, { status: 404 });
    }

    const token = createWsToken(sessionId, dbUser.id);

    return NextResponse.json({
      token,
      expiresIn: 3600,
      sessionId,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: API_USER_ERRORS.server }, { status: 500 });
  }
}
