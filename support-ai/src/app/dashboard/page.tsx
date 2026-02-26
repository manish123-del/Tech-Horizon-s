"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Message, Conversation } from "@/types";

export default function Dashboard() {
  const user = useUser();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [botConfig, setBotConfig] = useState<any>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configForm, setConfigForm] = useState({ system_prompt: "", theme_color: "", avatar_url: "" });

  useEffect(() => {
    if (user === null) {
      router.push("/login");
    }
    (async () => {
      setConfigLoading(true);
      const { data } = await supabase.from("bot_configs").select("*").limit(1).single();
      if (data) {
        setBotConfig(data);
        setConfigForm({
          system_prompt: data.system_prompt || "",
          theme_color: data.theme_color || "",
          avatar_url: data.avatar_url || ""
        });
      }
      setConfigLoading(false);
    })();
  }, [user]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentimentFilter, setSentimentFilter] = useState<string | null>(null);
  const [urgencyFilter, setUrgencyFilter] = useState<string | null>(null);
  const [languageFilter, setLanguageFilter] = useState<string | null>(null);
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  useEffect(() => {
    loadData();
  }, [sentimentFilter, urgencyFilter, languageFilter, flaggedOnly]);

  async function loadData() {
    setLoading(true);
    let q = supabase.from("conversations").select("*, messages(*)");
    if (languageFilter) q = q.eq("language", languageFilter);
    const { data } = await q;
    if (data) {
      setConversations(data as any);
      // flatten messages
      const msgs: Message[] = [];
      data.forEach((c: any) => {
        if (c.messages) msgs.push(...c.messages);
      });
      let filtered = msgs;
      if (sentimentFilter) filtered = filtered.filter((m) => m.sentiment === sentimentFilter);
      if (urgencyFilter) filtered = filtered.filter((m) => m.urgency === urgencyFilter);
      if (flaggedOnly) filtered = filtered.filter((m) => m.urgency === "critical" || (m as any).fraud);
      setMessages(filtered);
    }
    setLoading(false);
  }

  const total = conversations.length;
  const avgSentiment = messages.length
    ? (
        messages.reduce((sum, m) => {
          const score = m.sentiment === "positive" ? 1 : m.sentiment === "frustrated" ? -1 : m.sentiment === "negative" ? -0.5 : 0;
          return sum + score;
        }, 0) / messages.length
      ).toFixed(2)
    : "0";
  const langCounts: Record<string, number> = {};
  conversations.forEach((c) => {
    if (c.language) langCounts[c.language] = (langCounts[c.language] || 0) + 1;
  });

  async function saveConfig() {
    setConfigLoading(true);
    if (botConfig?.id) {
      await supabase.from("bot_configs").update(configForm).eq("id", botConfig.id);
    } else {
      await supabase.from("bot_configs").insert(configForm);
    }
    setConfigLoading(false);
    // refresh
    const { data } = await supabase.from("bot_configs").select("*").limit(1).single();
    setBotConfig(data);
  }

  function downloadCsv(convId?: string) {
    const url = `/api/export${convId ? `?conversationId=${convId}` : ""}`;
    window.open(url, "_blank");
  }

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardTitle>Total conversations</CardTitle>
          <CardValue>{total}</CardValue>
        </Card>
        <Card>
          <CardTitle>Avg sentiment score</CardTitle>
          <CardValue>{avgSentiment}</CardValue>
        </Card>
        <Card>
          <CardTitle>Top languages</CardTitle>
          <CardValue>{Object.entries(langCounts)
            .map(([l, c]) => `${l} (${c})`)
            .join(", ")}</CardValue>
        </Card>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Filters</h2>
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded border border-neutral-700 bg-neutral-900 p-2"
            value={sentimentFilter || ""}
            onChange={(e) => setSentimentFilter(e.target.value || null)}
          >
            <option value="">All sentiments</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
            <option value="frustrated">Frustrated</option>
          </select>
          <select
            className="rounded border border-neutral-700 bg-neutral-900 p-2"
            value={urgencyFilter || ""}
            onChange={(e) => setUrgencyFilter(e.target.value || null)}
          >
            <option value="">All urgency</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select
            className="rounded border border-neutral-700 bg-neutral-900 p-2"
            value={languageFilter || ""}
            onChange={(e) => setLanguageFilter(e.target.value || null)}
          >
            <option value="">All languages</option>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
            <option value="mr">Marathi</option>
            <option value="bn">Bengali</option>
          </select>
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={flaggedOnly}
              onChange={(e) => setFlaggedOnly(e.target.checked)}
            />
            <span className="text-sm">Flagged only</span>
          </label>
        </div>
      </section>
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Bot configuration</h2>
        {configLoading && <p>Loading...</p>}
        {!configLoading && (
          <div className="space-y-2">
            <textarea
              rows={3}
              className="w-full rounded border border-neutral-700 bg-neutral-900 p-2"
              placeholder="System prompt"
              value={configForm.system_prompt}
              onChange={(e) => setConfigForm((f) => ({ ...f, system_prompt: e.target.value }))}
            />
            <input
              type="text"
              className="w-full rounded border border-neutral-700 bg-neutral-900 p-2"
              placeholder="Theme color (hex)"
              value={configForm.theme_color}
              onChange={(e) => setConfigForm((f) => ({ ...f, theme_color: e.target.value }))}
            />
            <input
              type="text"
              className="w-full rounded border border-neutral-700 bg-neutral-900 p-2"
              placeholder="Avatar URL"
              value={configForm.avatar_url}
              onChange={(e) => setConfigForm((f) => ({ ...f, avatar_url: e.target.value }))}
            />
            <Button onClick={saveConfig} disabled={configLoading}>
              {configLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </section>
      <section>
        <h2 className="text-xl font-semibold">Conversations</h2>
        {loading && <p>Loading...</p>}
        {!loading && (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Language</th>
                <th className="p-2 text-left"># messages</th>
                <th className="p-2 text-left">Started</th>
                <th className="p-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((c) => (
                <tr key={c.id} className="border-b border-neutral-800 hover:bg-neutral-900">
                  <td className="p-2">{c.id}</td>
                  <td className="p-2">{c.language || "-"}</td>
                  <td className="p-2">{(c as any).messages?.length || 0}</td>
                  <td className="p-2">{new Date(c.started_at || "").toLocaleString()}</td>
                  <td className="p-2">
                    <Button onClick={() => downloadCsv(c.id)}>
                      Export
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
