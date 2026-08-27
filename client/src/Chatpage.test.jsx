import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatPage from './ChatPage.jsx';
import {
  makeSSEResponse,
  makeControllableSSE,
  makeJSONErrorResponse,
  makePendingFetch,
} from './test/mocks/sse.js';

// The chat input row is the only "form" this app has (query text + max
// price live entirely inside the model's tool call, not a separate form).
// Its validation is: don't send empty/whitespace input, and disable
// input+send while a request is already streaming.

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('empty state', () => {
  test('shows example prompts before any message is sent', () => {
    render(<ChatPage />);
    expect(
      screen.getByRole('button', { name: /running shoes under \$70 dikhao/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /wireless headphones hain kya/i })
    ).toBeInTheDocument();
  });

  test('clicking an example prompt fills the input', async () => {
    const user = userEvent.setup();
    render(<ChatPage />);
    await user.click(
      screen.getByRole('button', { name: /leather jacket dhoondo/i })
    );
    expect(screen.getByRole('textbox')).toHaveValue('Leather jacket dhoondo');
  });
});

describe('input validation (the "form")', () => {
  test('does not call the API when the input is empty or whitespace-only', async () => {
    const user = userEvent.setup();
    render(<ChatPage />);
    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(fetch).not.toHaveBeenCalled();

    await user.type(screen.getByRole('textbox'), '   ');
    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(fetch).not.toHaveBeenCalled();
  });

  test('Enter sends the message, Shift+Enter does not', async () => {
    fetch.mockReturnValue(makePendingFetch());
    const user = userEvent.setup();
    render(<ChatPage />);
    const textarea = screen.getByRole('textbox');

    await user.type(textarea, 'Hello');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(fetch).not.toHaveBeenCalled();

    await user.keyboard('{Enter}');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('disables the input and swaps Send for Stop while streaming', async () => {
    fetch.mockReturnValue(makePendingFetch());
    const user = userEvent.setup();
    render(<ChatPage />);

    await user.type(screen.getByRole('textbox'), 'Hello');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^send$/i })
    ).not.toBeInTheDocument();
  });
});

describe('message rendering — user + pending + streaming', () => {
  test('sending a message renders the user bubble', async () => {
    fetch.mockReturnValue(makePendingFetch());
    const user = userEvent.setup();
    render(<ChatPage />);

    await user.type(screen.getByRole('textbox'), 'Running shoes dikhao');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(screen.getByText('Running shoes dikhao')).toBeInTheDocument();
  });

  test('pending state: shows a placeholder (no content yet) before any chunk arrives', async () => {
    fetch.mockReturnValue(makePendingFetch());
    const user = userEvent.setup();
    render(<ChatPage />);

    await user.type(screen.getByRole('textbox'), 'Hi');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // still "in flight": Stop is showing, no error rendered, and the only
    // bubble text on screen is the user's own message (no assistant reply yet)
    expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    expect(screen.getAllByText('Hi')).toHaveLength(1);
  });

  test('streaming state: assistant text grows token by token, then finishes', async () => {
    const sse = makeControllableSSE();
    fetch.mockResolvedValue(sse.response);
    const user = userEvent.setup();
    render(<ChatPage />);

    await user.type(screen.getByRole('textbox'), 'Hi');
    await user.click(screen.getByRole('button', { name: /send/i }));

    sse.push({ token: 'Salam' });
    await waitFor(() => expect(screen.getByText('Salam')).toBeInTheDocument());

    sse.push({ token: '! Kaise madad karoon?' });
    await waitFor(() =>
      expect(
        screen.getByText('Salam! Kaise madad karoon?')
      ).toBeInTheDocument()
    );

    sse.done();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    );
  });
});

describe('error states', () => {
  test('network failure shows a network error with a Retry button', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));
    const user = userEvent.setup();
    render(<ChatPage />);

    await user.type(screen.getByRole('textbox'), 'Hi');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(
      await screen.findByText(/connection nahi ho saka/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  test('a 429 response shows the rate-limit error', async () => {
    fetch.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });
    const user = userEvent.setup();
    render(<ChatPage />);

    await user.type(screen.getByRole('textbox'), 'Hi');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText(/rate limit lag gaya/i)).toBeInTheDocument();
  });

  test('a non-ok response surfaces the server-provided error message', async () => {
    fetch.mockResolvedValue(makeJSONErrorResponse(500, 'Groq key invalid'));
    const user = userEvent.setup();
    render(<ChatPage />);

    await user.type(screen.getByRole('textbox'), 'Hi');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText('Groq key invalid')).toBeInTheDocument();
  });

  test('a mid-stream stream-error event is rendered as a server error', async () => {
    fetch.mockResolvedValue(
      makeSSEResponse([{ token: 'partial' }, { type: 'stream-error', error: 'Model timed out' }])
    );
    const user = userEvent.setup();
    render(<ChatPage />);

    await user.type(screen.getByRole('textbox'), 'Hi');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText('Model timed out')).toBeInTheDocument();
  });

  test('a stream that ends with no tokens shows the empty-response error', async () => {
    fetch.mockResolvedValue(makeSSEResponse([]));
    const user = userEvent.setup();
    render(<ChatPage />);

    await user.type(screen.getByRole('textbox'), 'Hi');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(
      await screen.findByText(/jawab adhoora reh gaya/i)
    ).toBeInTheDocument();
  });

  test('Retry re-sends the last user message without duplicating the user bubble', async () => {
    fetch.mockResolvedValueOnce(
      makeJSONErrorResponse(500, 'first attempt failed')
    );
    const user = userEvent.setup();
    render(<ChatPage />);

    await user.type(screen.getByRole('textbox'), 'Retry me');
    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(await screen.findByText('first attempt failed')).toBeInTheDocument();

    fetch.mockResolvedValueOnce(makeSSEResponse([{ token: 'Second try worked' }]));
    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(
      await screen.findByText('Second try worked')
    ).toBeInTheDocument();
    expect(screen.getAllByText('Retry me')).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});