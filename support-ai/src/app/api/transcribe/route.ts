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
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const nodeBuffer = Buffer.from(arrayBuffer);
    const response = await openai.audio.transcriptions.create({
      file: nodeBuffer,
      model: "whisper-1"
    } as any);
    const text = (response as any)?.text || "";
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || "transcribe failed") }, { status: 500 });
  }
}
