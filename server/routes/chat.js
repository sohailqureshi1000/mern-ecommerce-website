const { SYSTEM_PROMPT, MODEL } = require("../config/aiConfig");
const express = require("express");
const Groq = require("groq-sdk");
const { searchProducts, toolDefinition } = require("../tools/searchProducts");

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Dev-only sabotage switch for FE-08 testing: ?simulate=429 | malformed | midstream-fail
// Never honored in production, so it can't be abused as a real endpoint.
const SIMULATE_ENABLED = process.env.NODE_ENV !== "production";

router.post("/", async (req, res) => {
  const { messages } = req.body;
  const simulate = SIMULATE_ENABLED ? req.query.simulate : undefined;

  // Edge case: empty input — never even open a stream for it
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Message khali nahi ho sakta." });
  }

  // Edge case: rate limit
  if (simulate === "429") {
    return res.status(429).json({ error: "Rate limit exceeded (simulated)." });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  try {
    // Edge case: malformed JSON chunk mid-stream — client must skip it, not crash
    if (simulate === "malformed") {
      res.write(`data: {this is not valid json\n\n`);
    }

    const baseMessages = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

    // First pass: non-streaming, just to see if the model wants a tool
    const firstPass = await groq.chat.completions.create({
      model: MODEL,
      messages: baseMessages,
      tools: [toolDefinition],
      tool_choice: "auto",
    });

    const choice = firstPass.choices[0];
    const toolCalls = choice.message.tool_calls;

    let finalMessages = baseMessages;

    if (toolCalls && toolCalls.length > 0) {
      const call = toolCalls[0];

      // STATE 1: input-streaming (we fake a brief "building" moment)
      send({ type: "tool-start", tool: call.function.name });

      const args = JSON.parse(call.function.arguments);

      // STATE 2: input-available
      send({ type: "tool-input", tool: call.function.name, args });

      let toolResultMessage;
      try {
        const result = await searchProducts(args);
        // STATE 3: output-available
        send({ type: "tool-result", tool: call.function.name, result });
        toolResultMessage = JSON.stringify(result);
      } catch (err) {
        // STATE 4: output-error (e.g. "no products found")
        send({ type: "tool-error", tool: call.function.name, error: err.message });
        toolResultMessage = JSON.stringify({ error: err.message });
      }

      finalMessages = [
        ...baseMessages,
        choice.message,
        {
          role: "tool",
          tool_call_id: call.id,
          content: toolResultMessage,
        },
      ];
    }

    // Final pass: stream the assistant's reply (with or without tool context)
    const stream = await groq.chat.completions.create({
      model: MODEL,
      messages: finalMessages,
      stream: true,
    });

    let tokenCount = 0;
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || "";
      if (token) {
        send({ token });
        tokenCount++;
        // Edge case: connection/model dies partway through a real answer
        if (simulate === "midstream-fail" && tokenCount === 3) {
          throw new Error("Simulated mid-stream failure");
        }
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("Chat error:", err.message);
    // Headers (and possibly some tokens) are already sent by the time most
    // failures here can happen, so we can't switch to a 500 status anymore —
    // send a typed error event instead and let the client render it.
    const message =
      err?.status === 429
        ? "Rate limit lag gaya, thodi der baad try karein."
        : err.message || "Unexpected server error";
    send({ type: "stream-error", error: message });
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

module.exports = router;