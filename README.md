# SOHAIL — AI-Powered Streetwear Storefront

A dark streetwear ecommerce concept, rebuilt from a static HTML/CSS/JS storefront into a full-stack MERN application with an AI shopping assistant. Instead of a traditional product-grid homepage, the primary flow is a chat interface: users describe what they want in plain language (English or Roman Urdu) and the assistant searches the catalog and returns results inline.

**Live app:** https://sohail-fe06-client.vercel.app/chat
**API:** https://sohail-fe06-server.vercel.app

---

## What it does

- Chat-first shopping: type a request like *"Running shoes under $70 dikhao"* and get back a live product-card grid, not a wall of text.
- Streaming responses over Server-Sent Events (SSE) — tokens render as they arrive instead of waiting for the full reply.
- A `searchProducts` AI tool with a full 4-state lifecycle (building → searching → results → error), so the UI never shows a blank gap while the model works.
- Designed error and empty states for real-world failure modes (network drop, mid-stream cutoff, rate limits, malformed data) — sabotage-tested, not just happy-path.
- Rate limiting and input caps on the AI route so it can't be trivially abused by strangers hitting the public URL.

## Screenshots

> 
```
![Chat flow with product results](.client/docs/screenshot-chat.png)
![Handled error state](.client/docs/screenshot-error.png)
```

## Tech stack

| Layer      | Tech                                  |
|------------|----------------------------------------|
| Frontend   | React (Vite)                           |
| Backend    | Node.js + Express                      |
| AI model   | Groq (Llama-family model via `groq-sdk`) |
| Database   | MongoDB Atlas                          |
| Auth       | JWT                                    |
| Deployment | Vercel (client and server as separate projects) |

## Architecture overview

```
client/  React (Vite) SPA
  └── src/ChatPage.jsx  — chat UI, SSE consumer, tool-state rendering

server/  Express API (deployed as a Vercel serverless function)
  ├── index.js               — app entry, CORS, mounts /api/chat
  ├── routes/chat.js         — POST /api/chat — rate-limited SSE endpoint
  ├── tools/searchProducts.js — the searchProducts tool implementation
  ├── config/aiConfig.js     — system prompt + model config
  └── middleware/rateLimiter.js — per-IP rate limiter
```

**Request flow:** client posts the message history to `/api/chat` → server makes a first (non-streaming) Groq call to check if the model wants to call `searchProducts` → if it does, the tool runs and its result is sent back to the model → server makes a second, streaming Groq call for the final natural-language reply → tokens are pushed to the client over SSE as they arrive.

The client and server are deployed as **two separate Vercel projects** (not a monorepo build) so each can be redeployed and scaled independently.

## Run instructions

Clone and run locally:

```bash
git clone https://github.com/sohailqureshi1000/mern-ecommerce-website.git
cd mern-ecommerce-website
```

**Server:**
```bash
cd server
npm install
# create a .env file (see Environment Variables below)
node index.js
# server runs on http://localhost:5000
```

**Client** (in a separate terminal):
```bash
cd client
npm install
npm run dev
# client runs on http://localhost:5173 (or whatever Vite prints)
```

Open the client URL and go to `/chat`.

## Environment variables

**Server (`server/.env`):**

| Variable        | Required | Description                                              |
|-----------------|----------|------------------------------------------------------------|
| `GROQ_API_KEY`  | Yes      | API key for Groq — get one at [console.groq.com](https://console.groq.com) |
| `CLIENT_ORIGIN` | Yes      | Exact origin of the deployed client, used for CORS (e.g. `https://sohail-fe06-client.vercel.app`) |
| `NODE_ENV`      | Yes      | `development` locally, `production` when deployed — also disables the dev-only sabotage-testing switch on `/api/chat` |
| `PORT`          | No       | Local dev port, defaults to `5000`                        |

**Client:** no environment variables needed — the API base URL is set in `client/src/ChatPage.jsx` and automatically switches between `localhost:5000` in dev and the deployed server URL in production, based on Vite's `import.meta.env.DEV`.

## Key decisions

- **Chat-first, not a product grid.** The brief called for an AI-native experience, so the home page is a minimal stub that routes straight into `/chat` rather than a traditional storefront layout.
- **SSE over WebSockets.** The chat only needs one-directional streaming (server → client), so SSE was simpler to implement and debug than a full WebSocket connection, and works cleanly with Vercel's serverless functions.
- **Two-pass Groq call instead of a single streaming call with inline tool-calling.** The first (non-streaming) call decides whether a tool is needed; only the final reply streams. This keeps the tool-call lifecycle states (building/searching/results/error) explicit and easy to render, instead of trying to parse tool calls out of a token stream.
- **Per-IP in-memory rate limiting** rather than a database-backed limiter — simple, stateless, and enough for a portfolio-scale deployment; would need a shared store (e.g. Redis) if this ever ran across multiple server instances.

## How AI tools built this

_Fill this in with specifics before submitting — the evaluation checks for actual specifics, not general statements. Suggested structure:_

- **What Claude/AI wrote first-draft vs. what you wrote or rewrote by hand.** Example: "Claude generated the initial SSE streaming loop in `chat.js`; I rewrote the error-handling branch after testing mid-stream failures manually, because the first version returned a 500 after headers were already sent, which isn't valid for SSE."
- **A real prompt or two you used**, and what you changed after seeing the output.
- **Where AI got something wrong** that you had to catch and fix yourself.
- **Which parts you built without AI assistance**, if any.

## How AI tools built this

AI tools (Claude Code and Cursor's agent) were used throughout this repo for scaffolding, refactors, and reviews, guided by a `CLAUDE.md` project-rules file. Two concrete examples from the project's history:

**A controlled experiment on prompt quality (FE-03 workflow drill).** The account-settings form was built twice on separate branches to see how much prompt precision actually mattered: `round1-vague` (a one-sentence prompt, output accepted as-is) vs. `round2-precise` (a fresh session in plan mode, explicit file references, stated constraints, and a "write tests and run them" step). The vague prompt produced a form that *ran* but only validated two fields via the HTML `required` attribute — no email/phone format checks, no confirm-password field. The precise prompt produced a dedicated `validateSettingsForm.js` with regex-based validation, `aria-invalid`/`aria-describedby` wiring for screen readers, and two test files covering 8 named edge cases (empty submit, invalid email, mismatched confirm-password, etc.) vs. zero in the vague version. That comparison is where the `CLAUDE.md` rule *"never rely on the HTML `required` attribute alone, and never show one generic top-of-form alert"* came from — it's a lesson learned from watching the AI's own output fail, not a rule written in advance.

**A mistake AI caught in my own prompt, not a mistake it made.** When writing the round-2 prompt, I referenced a file (`@src/pages/Signup.jsx`) that doesn't actually exist in this repo. Instead of guessing or hallucinating a plausible-looking file, the agent stopped and asked which real file (`Login.jsx` or `Register.jsx`) to use as the pattern — and separately flagged that the existing settings form already had shipping-address fields my prompt hadn't mentioned, asking whether to keep or drop them. I kept them and had the same validation pattern applied across the whole form.

**A gap AI missed on both attempts.** Neither the vague nor the precise prompt produced server-side validation — `userController.js` is identical across both branches and only trims/lowercases input; it never checks email or phone format. Round 2's client-side validation is solid, but a direct API call still bypasses it entirely. This is now tracked as a known gap rather than something silently left unfixed.

**Performance and accessibility auditing** (FE-10) was AI-assisted end to end: baseline Lighthouse scores (69 performance / 88 accessibility) were diagnosed by AI as high Total Blocking Time from a Three.js canvas rendering continuously on the main thread, plus a 2MB unoptimized HDRI asset and low text contrast. Fixes — deferring canvas init until after first paint, switching to on-demand rendering (`frameloop="demand"`), dropping the heavy asset, fixing container height to prevent layout shift, and correcting color contrast to WCAG AAA — brought the scores to 99/100. I verified the result myself with Lighthouse and a manual keyboard-navigation pass rather than trusting the reported scores alone.

## License

MIT — see [LICENSE](./LICENSE).