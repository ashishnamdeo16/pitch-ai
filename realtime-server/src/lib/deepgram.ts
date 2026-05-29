import { DeepgramClient } from "@deepgram/sdk";

export type TranscriptHandler = (text: string, isFinal: boolean) => void;

type DeepgramMessage = {
  type?: string;
  is_final?: boolean;
  channel?: {
    alternatives?: Array<{ transcript?: string }>;
  };
};

/**
 * Server-side Deepgram live stream — keeps API key off the client.
 * Audio arrives as webm/opus chunks from the browser MediaRecorder.
 */
export class DeepgramStream {
  private connection: Awaited<
    ReturnType<DeepgramClient["listen"]["v1"]["connect"]>
  > | null = null;

  async start(language: string, onTranscript: TranscriptHandler): Promise<void> {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error("DEEPGRAM_API_KEY is not configured on the realtime server");
    }

    const client = new DeepgramClient({ apiKey });
    this.connection = await client.listen.v1.connect({
      model: "nova-2",
      language: language.replace("_", "-"),
      interim_results: "true",
      smart_format: "true",
      punctuate: "true",
      Authorization: `Token ${apiKey}`,
      connectionTimeoutInSeconds: 10,
    });

    this.connection.on("message", (data) => {
      if (!isResultsMessage(data)) return;
      const transcript = data.channel?.alternatives?.[0]?.transcript?.trim();
      if (!transcript) return;
      onTranscript(transcript, data.is_final ?? false);
    });

    this.connection.on("error", (err) => {
      console.error("[deepgram] stream error:", err.message);
    });

    // SDK v5 requires explicit connect() before waitForOpen()
    this.connection.connect();
    await this.connection.waitForOpen();
  }

  sendAudioChunk(base64: string): void {
    if (!this.connection) return;
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length === 0) return;
    this.connection.sendMedia(buffer);
  }

  close(): void {
    if (!this.connection) return;
    try {
      this.connection.sendFinalize({ type: "Finalize" });
    } catch {
      /* socket may already be closed */
    }
    try {
      this.connection.close();
    } catch {
      /* ignore */
    }
    this.connection = null;
  }
}

function isResultsMessage(data: unknown): data is DeepgramMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    (data as DeepgramMessage).type === "Results"
  );
}

/** Active Deepgram streams keyed by pitch session */
export const deepgramSessions = new Map<string, DeepgramStream>();

export async function startDeepgramSession(
  sessionId: string,
  language: string,
  onTranscript: TranscriptHandler
): Promise<void> {
  stopDeepgramSession(sessionId);
  const stream = new DeepgramStream();
  await stream.start(language, onTranscript);
  deepgramSessions.set(sessionId, stream);
}

export function stopDeepgramSession(sessionId: string): void {
  const stream = deepgramSessions.get(sessionId);
  if (stream) {
    stream.close();
    deepgramSessions.delete(sessionId);
  }
}

export function forwardAudioChunk(sessionId: string, base64: string): void {
  deepgramSessions.get(sessionId)?.sendAudioChunk(base64);
}
