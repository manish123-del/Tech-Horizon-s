import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { checkRateLimit } from "@/lib/rateLimiter";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.ip || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "rate limit exceeded" }, { status: 429 });
  }
  try {
    const { text, voice = "alloy" }: { text: string; voice?: string } = await req.json();
    if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
    const audio = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice,
      input: text
    } as any);
    const buf = Buffer.from(await audio.arrayBuffer());
    return new NextResponse(buf, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg" }
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || "tts failed") }, { status: 500 });
  }
}
