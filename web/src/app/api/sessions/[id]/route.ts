import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/redis";
import { API_USER_ERRORS } from "@/lib/user-messages";

const ALLOWED_PATCH_FIELDS = [
  "title",
  "status",
  "durationSeconds",
  "overallScore",
  "confidenceScore",
  "energyScore",
  "clarityScore",
  "pacingWpm",
  "fillerCount",
  "structureScore",
  "mode",
] as const;

const VALID_STATUSES = ["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"] as const;
const VALID_MODES = ["practice", "investor", "demo_day", "shark_tank"] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: API_USER_ERRORS.unauthorized }, { status: 401 });
    }

    const rl = await rateLimit(`session:get:${user.id}`, 60, 60);
    if (!rl.success) {
      return NextResponse.json({ error: API_USER_ERRORS.rateLimited }, { status: 429 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: API_USER_ERRORS.notFound }, { status: 404 });
    }

    const session = await prisma.pitchSession.findFirst({
      where: { id, userId: dbUser.id },
      include: {
        transcriptChunks: { orderBy: { sequence: "asc" } },
        analyses: { orderBy: { createdAt: "desc" }, take: 20 },
        investorQuestions: { orderBy: { askedAt: "desc" } },
        structureTags: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: API_USER_ERRORS.notFound }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: API_USER_ERRORS.unauthorized }, { status: 401 });
    }

    const rl = await rateLimit(`session:patch:${user.id}`, 30, 60);
    if (!rl.success) {
      return NextResponse.json({ error: API_USER_ERRORS.rateLimited }, { status: 429 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: API_USER_ERRORS.notFound }, { status: 404 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    for (const key of ALLOWED_PATCH_FIELDS) {
      if (key in body) data[key] = body[key];
    }

    if (data.title && typeof data.title === "string") {
      data.title = data.title.slice(0, 120);
    }

    if (
      data.status &&
      !VALID_STATUSES.includes(data.status as (typeof VALID_STATUSES)[number])
    ) {
      return NextResponse.json({ error: API_USER_ERRORS.invalidStatus }, { status: 400 });
    }

    if (
      data.mode &&
      !VALID_MODES.includes(data.mode as (typeof VALID_MODES)[number])
    ) {
      return NextResponse.json({ error: API_USER_ERRORS.invalidMode }, { status: 400 });
    }

    if (data.status === "COMPLETED") {
      data.endedAt = new Date();
    }

    const session = await prisma.pitchSession.updateMany({
      where: { id, userId: dbUser.id },
      data,
    });

    return NextResponse.json({ updated: session.count });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: API_USER_ERRORS.unauthorized }, { status: 401 });
    }

    const rl = await rateLimit(`session:delete:${user.id}`, 20, 60);
    if (!rl.success) {
      return NextResponse.json({ error: API_USER_ERRORS.rateLimited }, { status: 429 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: API_USER_ERRORS.notFound }, { status: 404 });
    }

    const deleted = await prisma.pitchSession.deleteMany({
      where: { id, userId: dbUser.id },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: API_USER_ERRORS.notFound }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
