import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generatePitchReportPDF } from "@/lib/pdf-report";
import { rateLimit } from "@/lib/redis";
import { sessionPdfFilename } from "@/lib/session-title";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await rateLimit(`reports:${user.id}`, 10, 60);
    if (!rl.success) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const session = await prisma.pitchSession.findFirst({
      where: { id: sessionId, userId: dbUser.id },
      include: {
        structureTags: true,
        analyses: { take: 10 },
        investorQuestions: true,
        transcriptChunks: { orderBy: { sequence: "asc" } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const transcript = session.transcriptChunks.map((c) => c.text).join(" ");
    const pdfBase64 = generatePitchReportPDF({
      title: session.title,
      date: session.createdAt,
      metrics: {
        overall: session.overallScore ?? 0,
        confidence: session.confidenceScore ?? 0,
        energy: session.energyScore ?? 0,
        clarity: session.clarityScore ?? 0,
        pacing: session.pacingWpm ?? 0,
        fillers: session.fillerCount,
        structure: session.structureScore ?? 0,
      },
      structure: session.structureTags,
      transcript,
      feedback: session.analyses.map((a) => a.content),
      questions: session.investorQuestions.map((q) => q.question),
    });

    const report = await prisma.report.upsert({
      where: { sessionId },
      create: {
        sessionId,
        userId: dbUser.id,
        title: `${session.title} Report`,
        summary: `Pitch score: ${session.overallScore ?? "N/A"}`,
        metrics: {
          overall: session.overallScore,
          fillers: session.fillerCount,
        },
      },
      update: {
        generatedAt: new Date(),
      },
    });

    return NextResponse.json({
      report,
      pdf: pdfBase64,
      filename: sessionPdfFilename(`${session.title} Report`),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
