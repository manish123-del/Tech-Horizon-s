import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

// simple conversation helper: GET returns last web conversation, POST creates new
export async function GET(req: NextRequest) {
  try {
    const { data: conv } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("channel", "web")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();
    return NextResponse.json(conv || {});
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { channel = "web" } = (await req.json()) as { channel?: string };
    const { data: conv } = await supabaseAdmin
      .from("conversations")
      .insert({ channel })
      .select("*")
      .single();
    return NextResponse.json(conv || {});
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
