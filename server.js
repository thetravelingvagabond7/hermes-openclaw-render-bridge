const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GENVIRAL_API_KEY = process.env.GENVIRAL_API_KEY;
const GENVIRAL_BASE_URL = "https://www.genviral.io/api/partner/v1";

let activeJob = null;
let cancelled = false;

async function sendTelegram(chatId, text) {
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: chatId || TELEGRAM_CHAT_ID,
    text: text.slice(0, 3900)
  });
}

async function askGroq(prompt) {
  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are Hermes, an execution-focused social media and monetization operator. Produce concise deployable outputs. Avoid generic advice. Prefer actions, captions, hooks, CTAs, and workflows."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 900
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      timeout: 45000
    }
  );

  return response.data.choices?.[0]?.message?.content || "No Groq response.";
}

async function genviralGetAccounts() {
  const response = await axios.get(`${GENVIRAL_BASE_URL}/accounts`, {
    headers: { Authorization: `Bearer ${GENVIRAL_API_KEY}` },
    timeout: 30000
  });

  return response.data;
}

async function genviralCreatePost(caption, accountIds = []) {
  const body = {
    caption,
    accounts: accountIds.map((id) => ({ id }))
  };

  const response = await axios.post(`${GENVIRAL_BASE_URL}/posts`, body, {
    headers: {
      Authorization: `Bearer ${GENVIRAL_API_KEY}`,
      "Content-Type": "application/json"
    },
    timeout: 30000
  });

  return response.data;
}

app.get("/", (req, res) => {
  res.send("Hermes/OpenClaw execution bridge is running.");
});

app.post("/telegram", async (req, res) => {
  res.sendStatus(200);

  const chatId = req.body.message?.chat?.id || TELEGRAM_CHAT_ID;
  const text = (req.body.message?.text || "").trim();

  if (!text) return;

  try {
    if (text.startsWith("/cancel")) {
      cancelled = true;
      activeJob = null;
      await sendTelegram(chatId, "CANCELLED. Ready for next small job.");
      return;
    }

    if (text.startsWith("/status")) {
      await sendTelegram(chatId, activeJob ? `ACTIVE JOB: ${activeJob}` : "No active job. Hermes is ready.");
      return;
    }

    if (text.startsWith("/accounts")) {
      const accounts = await genviralGetAccounts();
      await sendTelegram(chatId, "GENVIRAL ACCOUNTS:\n" + JSON.stringify(accounts, null, 2));
      return;
    }

    if (text.startsWith("/post ")) {
      const caption = text.replace("/post ", "").trim();

      if (!caption) {
        await sendTelegram(chatId, "Usage: /post Your caption here");
        return;
      }

      const accounts = await genviralGetAccounts();
      await sendTelegram(
        chatId,
        "GenViral is connected. I found your accounts. To avoid accidental posting, first run /accounts and then we will add selected account IDs to the posting command."
      );
      return;
    }

    if (text.startsWith("/queue")) {
      cancelled = false;
      activeJob = "queue";

      const batches = [
        "Generate 5 TikTok/Reels hooks, 5 CTA captions, and 5 hashtag sets for heartbreak acoustic country content driving Spring merch clicks.",
        "Generate 5 YouTube Shorts hooks, 5 CTAs, and 5 title ideas for emotional country/folk acoustic content.",
        "Generate 5 Spring merchandise promo concepts, 5 slogans, and 5 click-focused CTAs.",
        "Generate 5 platform optimization actions for TikTok, Instagram, YouTube, X, Pinterest.",
        "Generate 5 automation workflows using Oracle, Telegram, Groq, GenViral, GitHub, and PM2."
      ];

      for (let i = 0; i < batches.length; i++) {
        if (cancelled) {
          await sendTelegram(chatId, "QUEUE CANCELLED.");
          return;
        }

        const output = await askGroq(`Batch ${i + 1}: ${batches[i]}\nOutput concise deployable assets only.`);
        await sendTelegram(chatId, `BATCH ${i + 1} COMPLETE\n\n${output}`);
      }

      activeJob = null;
      await sendTelegram(chatId, "QUEUE COMPLETE. Ready for next command.");
      return;
    }

    activeJob = "single prompt";
    const reply = await askGroq(text);
    activeJob = null;
    await sendTelegram(chatId, reply);
  } catch (err) {
    activeJob = null;
    await sendTelegram(chatId, "ERROR: " + (err.response?.data?.message || err.message));
  }
});

app.listen(PORT, () => {
  console.log(`Hermes/OpenClaw execution bridge running on port ${PORT}`);
});
