// Helpers for building fake `fetch` Response objects that mimic
// server/routes/chat.js's SSE output, so tests never call the real API.

/**
 * A single-shot SSE response: give it the list of events (in the same shape
 * server/routes/chat.js sends via `send(obj)`) and it plays them all back,
 * then closes with [DONE]. Good for tests that only care about the final
 * state (e.g. "an error kind is rendered", "a tool result renders").
 */
export function makeSSEResponse(events, { ok = true, status = 200 } = {}) {
  const encoder = new TextEncoder();
  const chunks = events.map(
    (e) => `data: ${typeof e === 'string' ? e : JSON.stringify(e)}\n\n`
  );
  chunks.push('data: [DONE]\n\n');

  let i = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i]));
        i += 1;
      } else {
        controller.close();
      }
    },
  });

  return { ok, status, body: stream, json: async () => ({}) };
}

/**
 * A controllable SSE stream: the test pushes events one at a time and can
 * `await waitFor(...)` between pushes to assert intermediate UI state
 * (e.g. partial streamed text) before the response finishes.
 */
export function makeControllableSSE() {
  const encoder = new TextEncoder();
  let controllerRef;
  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
    },
  });

  return {
    response: { ok: true, status: 200, body: stream, json: async () => ({}) },
    push(event) {
      const line = `data: ${typeof event === 'string' ? event : JSON.stringify(event)}\n\n`;
      controllerRef.enqueue(encoder.encode(line));
    },
    done() {
      controllerRef.enqueue(encoder.encode('data: [DONE]\n\n'));
      controllerRef.close();
    },
  };
}

/** A non-streaming JSON error response — mimics the 429 / non-ok JSON branches. */
export function makeJSONErrorResponse(status, errorMessage) {
  return {
    ok: false,
    status,
    body: null,
    json: async () => ({ error: errorMessage }),
  };
}

/** Never resolves — for asserting the pending state before any response arrives. */
export function makePendingFetch() {
  return new Promise(() => {});
}