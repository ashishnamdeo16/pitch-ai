import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { PITCH_ELEMENTS } from "@/lib/constants";
import { rateLimit } from "@/lib/redis";

const VALID_MODES = ["practice", "investor", "demo_day", "shark_tank"] as const;

interface FinalizeBody {
  transcript?: string;
  durationSeconds?: number;
  overallScore?: number;
  confidenceScore?: number;
  energyScore?: number;
  clarityScore?: number;
  pacingWpm?: number;
  fillerCount?: number;
  structureScore?: number;
  mode?: string;
  structure?: Array<{ element: string; detected: boolean; excerpt?: string }>;
  feedback?: Array<{ type: string; content: string }>;
}

/** Persist session results after live pitch ends */
export async function POST(
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await rateLimit(`finalize:${user.id}`, 20, 60);
    if (!rl.success) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json()) as FinalizeBody;

    const existing = await prisma.pitchSession.findFirst({
      where: { id, userId: dbUser.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const transcript = (body.transcript || "").slice(0, 50000);

    await prisma.$transaction(async (tx) => {
      await tx.pitchSession.update({
        where: { id },
        data: {
          status: "COMPLETED",
          endedAt: new Date(),
          durationSeconds: body.durationSeconds ?? existing.durationSeconds,
          overallScore: body.overallScore ?? existing.overallScore,
          confidenceScore: body.confidenceScore ?? existing.confidenceScore,
          energyScore: body.energyScore ?? existing.energyScore,
          clarityScore: body.clarityScore ?? existing.clarityScore,
          pacingWpm: body.pacingWpm ?? existing.pacingWpm,
          fillerCount: body.fillerCount ?? existing.fillerCount,
          structureScore: body.structureScore ?? existing.structureScore,
          ...(body.mode && VALID_MODES.includes(body.mode as (typeof VALID_MODES)[number])
            ? { mode: body.mode }
            : {}),
        },
      });

      if (transcript.length > 0) {
        await tx.transcriptChunk.deleteMany({ where: { sessionId: id } });
        await tx.transcriptChunk.create({
          data: {
            sessionId: id,
            sequence: 1,
            text: transcript.replace(/⟦|⟧/g, ""),
            isFinal: true,
          },
        });
      }

      if (body.structure?.length) {
        for (const s of body.structure) {
          if (!PITCH_ELEMENTS.some((e) => e.id === s.element)) continue;
          await tx.structureTag.upsert({
            where: { sessionId_element: { sessionId: id, element: s.element } },
            create: {
              sessionId: id,
              element: s.element,
              detected: s.detected,
              excerpt: s.excerpt?.slice(0, 200),
            },
            update: {
              detected: s.detected,
              excerpt: s.excerpt?.slice(0, 200),
            },
          });
        }
      }

      if (body.feedback?.length) {
        const top = body.feedback.slice(0, 10);
        await tx.aIAnalysis.deleteMany({ where: { sessionId: id } });
        await tx.aIAnalysis.createMany({
          data: top.map((f) => ({
            sessionId: id,
            type: f.type || "feedback",
            content: f.content.slice(0, 2000),
          })),
        });
      }
    });

    return NextResponse.json({ success: true, sessionId: id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
