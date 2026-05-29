import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { correctPitchStt } from "@/lib/stt-corrections";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
    }

    const groq = new Groq({ apiKey });
    const formData = await req.formData();
    const audio = formData.get("audio");

    if (!audio || !(audio instanceof Blob) || audio.size === 0) {
      return NextResponse.json({ error: "No audio file" }, { status: 400 });
    }

    const file = new File([audio], "audio.webm", {
      type: audio.type || "audio/webm",
    });

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      language: "en",
      response_format: "json",
      prompt:
        "Startup pitch coaching. Vocabulary: pitch, pitch deck, elevator pitch, investor, VC, traction, GTM, MVP, market, solution, founder.",
    });

    return NextResponse.json({
      text: correctPitchStt(transcription.text ?? ""),
    });
  } catch {
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
