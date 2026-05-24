const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.get("/", (req, res) => {
  res.send("Hermes/OpenClaw bridge is running.");
});

app.post("/telegram", async (req, res) => {
  try {
    const message = req.body.message?.text || "";
    const chatId = req.body.message?.chat?.id;

    if (!message) return res.sendStatus(200);

    const aiResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          {
            role: "system",
            content: "You are Hermes/OpenClaw command assistant. Help Chris manage AI agents, social media workflows, and automation."
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

    const reply = aiResponse.data.choices?.[0]?.message?.content || "No response.";

    await axios.post(https://api.telegram.org/bot/sendMessage, {
      chat_id: chatId || TELEGRAM_CHAT_ID,
      text: reply
    });

    res.sendStatus(200);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(Bridge running on port );
});
