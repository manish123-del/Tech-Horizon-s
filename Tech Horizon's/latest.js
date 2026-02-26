import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🎤 MAIN VOICE ROUTE
app.post("/voice", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    // 1️⃣ Speech to Text
    const transcript = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1",
    });

    const userText = transcript.text;

    // Delete uploaded file after processing
    fs.unlinkSync(req.file.path);

    // 2️⃣ Emotion Detection (structured & accurate)
    const emotionRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Detect emotion from text. Reply only one word: happy, neutral, angry.",
        },
        {
          role: "user",
          content: userText,
        },
      ],
      temperature: 0,
    });

    const emotion = emotionRes.choices[0].message.content.trim().toLowerCase();

    // 3️⃣ Dynamic Business Mode
    const businessType = "E-commerce"; // change dynamically if needed

    let toneInstruction = "";

    if (emotion === "angry") {
      toneInstruction = "Customer seems angry. Reply very politely and calmly.";
    } else if (emotion === "happy") {
      toneInstruction = "Customer seems happy. Maintain friendly tone.";
    } else {
      toneInstruction = "Maintain professional tone.";
    }

    // 4️⃣ AI Response
    const chatRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
          You are an intelligent multilingual AI customer support agent for ${businessType}.
          Understand Hindi, English and Hinglish.
          ${toneInstruction}
          Keep response short and natural like human.
          `,
        },
        {
          role: "user",
          content: userText,
        },
      ],
    });

    const replyText = chatRes.choices[0].message.content;

    // 5️⃣ Call Summary (Hackathon Winning Feature)
    const summaryRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Generate a short 1-line call summary.",
        },
        {
          role: "user",
          content: `Customer said: ${userText} | Agent replied: ${replyText}`,
        },
      ],
    });

    const summary = summaryRes.choices[0].message.content;

    // 6️⃣ Text to Speech
    const speech = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: replyText,
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());

    // 7️⃣ Final Response
    res.json({
      success: true,
      transcript: userText,
      emotion: emotion,
      reply: replyText,
      summary: summary,
      audio: audioBuffer.toString("base64"),
    });
  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({
      success: false,
      error: "Something went wrong",
    });
  }
});

app.listen(5000, () => {
  console.log("🚀 AI Voice Agent running on http://localhost:5000");
});
