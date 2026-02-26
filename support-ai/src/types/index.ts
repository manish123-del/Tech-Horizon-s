export type Role = "user" | "assistant";

export type Message = {
  id: string;
  conversation_id?: string;
  role: Role;
  content: string;
  audio_url?: string;
  sentiment?: "positive" | "neutral" | "negative" | "frustrated";
  urgency?: "low" | "medium" | "high" | "critical";
  fraud?: boolean;
  language?: string;
  created_at?: string;
};

export type Conversation = {
  id: string;
  user_id?: string;
  channel: "web" | "whatsapp";
  language?: string;
  started_at?: string;
};

export type BotConfig = {
  id: string;
  business_name?: string;
  system_prompt: string;
  theme_color?: string;
  avatar_url?: string;
};
