import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/redis";
import { nextSessionTitle } from "@/lib/session-title";

const VALID_MODES = ["practice", "investor", "demo_day", "shark_tank"] as const;

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await rateLimit(`sessions:get:${user.id}`, 60, 60);
    if (!rl.success) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ sessions: [] });
    }

    const sessions = await prisma.pitchSession.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        overallScore: true,
        durationSeconds: true,
        fillerCount: true,
        mode: true,
        createdAt: true,
        status: true,
      },
    });

    return NextResponse.json({ sessions });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await rateLimit(`sessions:${user.id}`, 30, 60);
    if (!rl.success) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const body = await request.json();
    const mode = VALID_MODES.includes(body.mode) ? body.mode : "practice";

    let dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          supabaseId: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name,
          avatarUrl: user.user_metadata?.avatar_url,
        },
      });
    }

    const title = await nextSessionTitle(
      dbUser.id,
      mode,
      typeof body.title === "string" ? body.title : undefined
    );

    const session = await prisma.pitchSession.create({
      data: {
        userId: dbUser.id,
        title,
        mode,
      },
    });

    return NextResponse.json({ session });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
