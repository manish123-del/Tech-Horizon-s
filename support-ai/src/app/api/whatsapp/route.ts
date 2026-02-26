import { NextRequest, NextResponse } from "next/server";
// `process` is defined in src/global.d.ts, so no local declaration is required.
import twilio from "twilio";
import { openai } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rateLimiter";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.ip || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({}, { status: 200 });
  }

  try {
    const body = await req.formData();
    const from = String(body.get("From") || "");
    const msg = String(body.get("Body") || "");
    if (!from || !msg) return NextResponse.json({}, { status: 200 });
    // store conversation/message in Supabase
    const { data: conv } = await supabaseAdmin
      .from("conversations")
      .insert({ channel: "whatsapp" })
      .select("id")
      .single();
    const conversationId = conv?.id;
    if (conversationId) {
      await supabaseAdmin.from("messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: msg
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Reply as a helpful customer support assistant." },
        { role: "user", content: msg }
      ],
      temperature: 0.4
    });
    const reply = completion.choices?.[0]?.message?.content || "Thanks for the message.";
    const client =
      process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
        ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
        : null;
    if (client && process.env.TWILIO_WHATSAPP_FROM) {
      await client.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
        to: from,
        body: reply
      });
    }
    if (conversationId) {
      await supabaseAdmin.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: reply
      });
    }
    return NextResponse.json({}, { status: 200 });
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}
