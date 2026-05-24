const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.get("/", (req, res) => {
  res.send("Hermes/OpenClaw Groq bridge is running.");
});

app.post("/telegram", async (req, res) => {
  try {
    const message = req.body.message?.text || "";
    const chatId = req.body.message?.chat?.id || TELEGRAM_CHAT_ID;

    if (!message) return res.sendStatus(200);

    const aiResponse = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are Hermes/OpenClaw command assistant for Chris. Help manage AI agents, social media workflows, automation, content planning, monetization, and technical setup. Be direct and action-focused."
          },
          {
            role: "user",
            content: message
          }
        ]
      },
      {
        headers: {
          Authorization: Bearer ,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = aiResponse.data.choices?.[0]?.message?.content || "No response from Groq.";

    await axios.post(https://api.telegram.org/bot/sendMessage, {
      chat_id: chatId,
      text: reply
    });

    res.sendStatus(200);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(Hermes/OpenClaw Groq bridge running on port );
});
