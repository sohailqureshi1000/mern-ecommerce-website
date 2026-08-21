// routes/chat.js — ab yeh streaming version hai
const { SYSTEM_PROMPT, MODEL } = require("../config/aiConfig");
const express = require("express");
const Groq = require("groq-sdk");

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.post("/", async (req, res) => {
  try {
    const { messages } = req.body; // ab poori conversation history bhejenge, sirf ek message nahi

    // SSE ke liye zaroori headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // headers turant client ko bhej do

    const stream = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      stream: true, // yehi asal "streaming" wala switch hai
    });
    // Groq se chunks aate rahenge, hum har chunk client ko forward karenge
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || "";
      if (token) {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n"); // client ko batayega ke stream khatam ho gayi
    res.end();
  } catch (err) {
    console.error("Chat error:", err.message);
    // agar headers already bhej chuke hain to res.status use nahi kar sakte
    if (!res.headersSent) {
      res.status(500).json({ error: "Kuch masla ho gaya" });
    } else {
      res.end();
    }
  }
});

module.exports = router;
