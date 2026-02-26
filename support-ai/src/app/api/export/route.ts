import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

function toCsv(rows: any[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => JSON.stringify(r[h] ?? "")).join(","));
  }
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const convId = searchParams.get("conversationId");
    let query = supabaseAdmin.from("messages").select("*");
    if (convId) query = query.eq("conversation_id", convId);
    const { data } = await query;
    if (!data) return NextResponse.json({ error: "no data" }, { status: 404 });
    const csv = toCsv(data);
    return new NextResponse(csv, {
      status: 200,
      headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=export.csv" }
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
