import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "";

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// In-memory analytics
const stats = {
  totalConversations: 0,
  urgentCases: 0,
  angryCustomers: 0,
};

// Mock data for demo
const MOCK_DB = {
  orders: {
    "ORD12345": { status: "Shipped", etaDays: 2 },
    "ORD98765": { status: "Processing", etaDays: 3 },
  },
  payments: {
    "PAY4321": { status: "Captured", amount: 1499 },
    "PAY6789": { status: "Pending", amount: 899 },
  },
  refunds: {
    "REF1111": { status: "Initiated", daysRemaining: 5 },
  },
};

function safeJsonParse(text) {
  try {
    const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function detectEmotionHeuristics(text) {
  const t = text.toLowerCase();
  if (/(gussa|angry|frustrated|naraaz)/.test(t)) return "angry";
  if (/(confused|samajh|samaj nahi|unclear)/.test(t)) return "confused";
  if (/(urgent|turant|jaldi|immediately|asap)/.test(t)) return "urgent";
  if (/(thank|shukriya|dhanyavad|great|awesome|happy)/.test(t)) return "happy";
  return "neutral";
}

function detectUrgencyHeuristics(text) {
  const t = text.toLowerCase();
  if (/(urgent|turant|immediately|asap|bilkul abhi|very important)/.test(t)) return "high";
  if (/(payment.*confirm|refund.*status|order.*delay|bahut der)/.test(t)) return "medium";
  return "low";
}

function simulateBusinessResponse(text) {
  const t = text.toLowerCase();
  let reply = "";
  let intent = "general";

  if (/order|tracker|track|ord\d+|awb/i.test(t)) {
    intent = "order_tracking";
    const idMatch = t.match(/ord\d+/i);
    const id = idMatch ? idMatch[0].toUpperCase() : "ORD12345";
    const info = MOCK_DB.orders[id] || MOCK_DB.orders["ORD12345"];
    reply =
      `Order ${id} is ${info.status}. Estimated delivery in ${info.etaDays} days. ` +
      `Would you like SMS updates?`;
  } else if (/payment|paid|transaction|utr|upi|card/i.test(t)) {
    intent = "payment_issue";
    const idMatch = t.match(/pay\d+/i);
    const id = idMatch ? idMatch[0].toUpperCase() : "PAY4321";
    const info = MOCK_DB.payments[id] || MOCK_DB.payments["PAY4321"];
    reply =
      `I can see payment ${id} is ${info.status} for ₹${info.amount}. ` +
      `If order isn't confirmed yet, I'll refresh backend and ensure confirmation within 10 minutes.`;
  } else if (/complaint|issue|problem|shikayat|register/i.test(t)) {
    intent = "complaint_registration";
    reply =
      "I've registered your complaint and shared the ticket on SMS/email. " +
      "Can you describe the issue briefly so we can resolve it faster?";
  } else if (/refund|return|money back|paise wapas/i.test(t)) {
    intent = "refund_status";
    const id = "REF1111";
    const info = MOCK_DB.refunds[id];
    reply = `Refund ${id} is ${info.status}. It will be completed in ${info.daysRemaining} days.`;
  } else {
    reply =
      "Thanks for sharing. I can help with order tracking, payments, complaints, or refunds. " +
      "Please tell me a bit more.";
  }

  return { reply, intent };
}

async function callOpenAIForStructure(userText, lang = "auto") {
  if (!openai) return null;
  try {
    const systemPrompt =
      "You are a highly intelligent, human-like, multilingual customer support voice assistant.\n" +
      "You:\n" +
      "- Understand Hindi and English\n" +
      "- Respond naturally and conversationally\n" +
      "- Detect emotion (angry, urgent, confused, happy)\n" +
      "- Show empathy when needed\n" +
      "- Keep answers concise but helpful\n" +
      "- Ask follow-up questions if required\n" +
      "Return STRICT JSON with keys: reply, detectedEmotion, urgencyLevel.";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });
    const content = completion.choices?.[0]?.message?.content ?? "";
    return safeJsonParse(content);
  } catch (err) {
    return null;
  }
}

async function maybeTriggerN8N(payload) {
  if (!N8N_WEBHOOK_URL) return;
  try {
    await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // ignore errors for demo
  }
}

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/stats", (req, res) => {
  res.json(stats);
});

app.post("/chat", async (req, res) => {
  const { text, lang = "auto", conversationId = null } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Text is required" });
  }

  stats.totalConversations += 1;

  const aiStruct = await callOpenAIForStructure(text, lang);
  const { reply: simulatedReply, intent } = simulateBusinessResponse(text);

  const detectedEmotion = aiStruct?.detectedEmotion || detectEmotionHeuristics(text);
  const urgencyLevel = aiStruct?.urgencyLevel || detectUrgencyHeuristics(text);
  const reply =
    aiStruct?.reply
      ? `${aiStruct.reply}\n\n${simulatedReply}`
      : simulatedReply;

  if (detectedEmotion === "angry") stats.angryCustomers += 1;
  if (urgencyLevel === "high") stats.urgentCases += 1;

  if (urgencyLevel === "high") {
    maybeTriggerN8N({
      event: "escalation",
      reason: "high_urgency",
      text,
      intent,
      detectedEmotion,
      conversationId,
      timestamp: Date.now(),
    }).catch(() => {});
  }

  res.json({
    reply,
    detectedEmotion,
    urgencyLevel,
    intent,
  });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
