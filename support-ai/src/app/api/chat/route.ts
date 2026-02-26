// @ts-ignore: next/server types may not be available in this environment
import { NextRequest, NextResponse } from "next/server";
// `process` is typed globally via src/global.d.ts; no local declaration needed.
import { openai } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rateLimiter";
export const runtime = "nodejs";

function analyze(text: string) {
  const t = text.toLowerCase();
  let sentiment: "positive" | "neutral" | "negative" | "frustrated" = "neutral";
  if (/(thank|great|awesome)/.test(t)) sentiment = "positive";
  if (/(angry|mad|frustrated|naraaz)/.test(t)) sentiment = "frustrated";
  if (/(bad|terrible|hate)/.test(t)) sentiment = "negative";
  let urgency: "low" | "medium" | "high" | "critical" = "low";
  if (/(urgent|asap|immediately|bilkul abhi)/.test(t)) urgency = "high";
  if (/(critical|emergency)/.test(t)) urgency = "critical";
  let language = "en";
  if (/\b(bhai|ha|namaste|kya)\b/.test(t)) language = "hi";
  // quick heuristics for other languages using common words
  if (/\b(vandhanam|vanakkam)\b/.test(t)) language = "ta";
  if (/\b(ena|naa|naku)\b/.test(t)) language = "te";
  if (/\b(kaay|ahe|mi)\b/.test(t)) language = "mr";
  if (/\b(amar|tumi|koto)\b/.test(t)) language = "bn";
  let fraud = false;
  if (/(refund|chargeback|scam|hack)/.test(t)) fraud = true;
  return { sentiment, urgency, language, fraud };
}

export async function POST(req: NextRequest) {
  // NextRequest does not include ip field; use header only
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "rate limit exceeded" }, { status: 429 });
  }

  try {
    const { text, systemPrompt, conversationId }: { text: string; systemPrompt?: string; conversationId?: string } = await req.json();
    if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

    const analysis = analyze(text);

    // create or fetch conversation row
    let convId = conversationId;
    if (!convId) {
      const { data: newConv } = await supabaseAdmin
        .from("conversations")
        .insert({ channel: "web" })
        .select("id")
        .single();
      convId = newConv?.id;
    }

    // store user message
    if (convId) {
      await supabaseAdmin.from("messages").insert({
        conversation_id: convId,
        role: "user",
        content: text,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        language: analysis.language,
        fraud: analysis.fraud
      });
    }

    const messages = [
      {
        role: "system",
        content:
          systemPrompt ||
          "You are a multilingual customer support assistant. Detect user language and reply in the same language."
      },
      { role: "user", content: text }
    ] as any[];
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3
    });
    const reply = completion.choices?.[0]?.message?.content || "";

    // store assistant message
    if (convId) {
      await supabaseAdmin.from("messages").insert({
        conversation_id: convId,
        role: "assistant",
        content: reply,
        sentiment: "neutral",
        language: analysis.language,
        fraud: analysis.fraud
      });
      // update conversation language if detected
      await supabaseAdmin
        .from("conversations")
        .update({ language: analysis.language })
        .eq("id", convId);
    }

    // flag critical urgency
    if (analysis.urgency === "critical" && convId) {
      await supabaseAdmin.from("flagged_events").insert({
        conversation_id: convId,
        reason: "critical urgency detected"
      });
      const webhookUrl = (process as any)?.env?.FLAGGED_WEBHOOK_URL;
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: convId, reason: "critical urgency detected", text })
        }).catch(() => {});
      }
    }
    // fraud pattern detected
    if (analysis.fraud && convId) {
      await supabaseAdmin.from("flagged_events").insert({
        conversation_id: convId,
        reason: "fraudulent language pattern detected"
      });
      const webhookUrl2 = (process as any)?.env?.FLAGGED_WEBHOOK_URL;
      if (webhookUrl2) {
        fetch(webhookUrl2, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: convId, reason: "fraudulent language pattern detected", text })
        }).catch(() => {});
      }
    }

    return NextResponse.json({ reply, ...analysis, conversationId: convId });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || "chat failed") }, { status: 500 });
  }
}
