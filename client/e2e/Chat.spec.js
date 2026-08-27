import { test, expect } from '@playwright/test';

// Primary flow: user opens the chat, asks a question, and sees the
// assistant's reply. The real /api/chat route is intercepted so this
// test never depends on Groq or the live server being up.
// The client (localhost:5173) and the API (localhost:5000 in dev, per
// ChatPage.jsx's API_URL) are different origins, so the real browser CORS
// check applies even to a mocked response — a fetch preflight (OPTIONS)
// fires first, and the fulfilled response needs Access-Control-Allow-Origin
// or the browser silently blocks it and the test never sees the reply.
const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*' };

async function mockChatRoute(page, respond) {
  await page.route('**/api/chat', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          ...CORS_HEADERS,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    await respond(route);
  });
}

test('user can send a message and see the assistant reply', async ({ page }) => {
  await mockChatRoute(page, async (route) => {
    const body = [
      'data: {"token":"Salam! "}',
      'data: {"token":"Yahan hain kuch results."}',
      'data: [DONE]',
      '',
    ].join('\n\n');

    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: CORS_HEADERS,
      body,
    });
  });

  await page.goto('/chat');

  const input = page.getByRole('textbox');
  await input.fill('Running shoes under $70 dikhao');
  await page.getByRole('button', { name: /send/i }).click();

  await expect(page.getByText('Running shoes under $70 dikhao')).toBeVisible();
  await expect(page.getByText(/Salam! Yahan hain kuch results\./)).toBeVisible();

  // Input is usable again once the reply finishes streaming
  await expect(page.getByRole('button', { name: /send/i })).toBeVisible();
});

test('a failed request shows an error with a working retry', async ({ page }) => {
  let attempt = 0;
  await mockChatRoute(page, async (route) => {
    attempt += 1;
    if (attempt === 1) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Simulated failure' }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        headers: CORS_HEADERS,
        body: 'data: {"token":"Recovered on retry"}\n\ndata: [DONE]\n\n',
      });
    }
  });

  await page.goto('/chat');
  await page.getByRole('textbox').fill('Hello');
  await page.getByRole('button', { name: /send/i }).click();

  await expect(page.getByText('Simulated failure')).toBeVisible();

  await page.getByRole('button', { name: /retry/i }).click();
  await expect(page.getByText('Recovered on retry')).toBeVisible();
});