import { useState, useRef, useEffect, useCallback } from 'react';

const EXAMPLE_PROMPTS = [
  'Running shoes under $70 dikhao',
  'Wireless headphones hain kya?',
  'Leather jacket dhoondo',
];

const API_URL = import.meta.env.DEV
  ? 'http://localhost:5000/api/chat'
  : 'https://sohail-fe06-server.vercel.app/api/chat';

function ChatPage() {
  const [messages, setMessages] = useState([]); // {role, content, tool, error}
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [viewportHeight, setViewportHeight] = useState(null);

  const chatBoxRef = useRef(null);
  const abortControllerRef = useRef(null);
  const textareaRef = useRef(null);

  // Mobile Safari: the keyboard shrinks the *visual* viewport, not the layout
  // viewport, so plain 100vh/100dvh leaves a dead gap under the pinned input.
  // Track visualViewport.height and use it as the real page height when available.
  useEffect(() => {
    if (!window.visualViewport) return;
    const vv = window.visualViewport;
    const onResize = () => setViewportHeight(vv.height);
    onResize();
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (isAtBottom && chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isAtBottom]);

  const handleScroll = () => {
    const box = chatBoxRef.current;
    if (!box) return;
    const threshold = 50;
    const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < threshold;
    setIsAtBottom(atBottom);
  };

  const updateLastAssistant = (updater) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const last = updated[updated.length - 1];
      updated[updated.length - 1] = { ...last, ...updater(last) };
      return updated;
    });
  };

  const appendToken = (token) => {
    updateLastAssistant((last) => ({ content: last.content + token }));
  };

  // Shared by a fresh send AND a retry, so retry never re-appends the user
  // bubble — it just re-sends the same history to a fresh assistant slot.
  const streamChat = useCallback(async (apiMessages) => {
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: 'assistant', content: '', tool: null, error: null }]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
        signal: controller.signal,
      });

      if (response.status === 429) {
        updateLastAssistant(() => ({
          error: { kind: 'rate_limit', message: 'Bohat zyada requests ho gayi hain. Thodi der ruk kar dobara try karein.' },
        }));
        return;
      }

      if (!response.ok) {
        let serverMsg = 'Server ne request process nahi ki.';
        try {
          const body = await response.json();
          if (body?.error) serverMsg = body.error;
        } catch {
          // body wasn't JSON — keep the default message, don't crash on it
        }
        updateLastAssistant(() => ({ error: { kind: 'server', message: serverMsg } }));
        return;
      }

      if (!response.body) {
        updateLastAssistant(() => ({ error: { kind: 'stream', message: 'Response stream nahi mila.' } }));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let receivedAnyContent = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') continue;

          let parsed;
          try {
            parsed = JSON.parse(dataStr);
          } catch {
            // Malformed chunk from the server — skip it, don't kill the whole stream
            continue;
          }

          if (parsed.type === 'tool-start') {
            receivedAnyContent = true;
            updateLastAssistant(() => ({ tool: { name: parsed.tool, state: 'input-streaming' } }));
          } else if (parsed.type === 'tool-input') {
            updateLastAssistant((last) => ({ tool: { ...last.tool, state: 'input-available', args: parsed.args } }));
          } else if (parsed.type === 'tool-result') {
            updateLastAssistant((last) => ({ tool: { ...last.tool, state: 'output-available', result: parsed.result } }));
          } else if (parsed.type === 'tool-error') {
            updateLastAssistant((last) => ({ tool: { ...last.tool, state: 'output-error', error: parsed.error } }));
          } else if (parsed.type === 'stream-error') {
            updateLastAssistant(() => ({
              error: { kind: 'server', message: parsed.error || 'Server mein masla hua.' },
            }));
            return;
          } else if (parsed.token) {
            receivedAnyContent = true;
            appendToken(parsed.token);
          }
        }
      }

      // Connection ended (e.g. killed mid-stream) with nothing ever rendered —
      // show a designed error instead of leaving a permanently empty bubble.
      if (!receivedAnyContent) {
        updateLastAssistant(() => ({
          error: { kind: 'empty', message: 'Jawab adhoora reh gaya. Dobara try karein.' },
        }));
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // user hit Stop — not an error state
      const isNetworkError = err instanceof TypeError;
      updateLastAssistant(() => ({
        error: {
          kind: isNetworkError ? 'network' : 'unknown',
          message: isNetworkError
            ? 'Internet connection check karein aur dobara try karein.'
            : 'Kuch masla ho gaya. Dobara try karein.',
        },
      }));
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, []);

  const sendMessage = (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || isStreaming) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    streamChat(newMessages.map(({ role, content }) => ({ role, content })));
  };

  // Retries the failed turn only — the last user message, not the whole
  // conversation — and is a no-op while a request is already in flight,
  // so a double-click can't fire two overlapping streams.
  const retryLastMessage = () => {
    if (isStreaming) return;
    const hasUserMessage = [...messages].some((m) => m.role === 'user');
    if (!hasUserMessage) return;

    const historyForApi = messages.slice(0, -1).map(({ role, content }) => ({ role, content }));
    setMessages((prev) => prev.slice(0, -1)); // drop the failed assistant bubble
    streamChat(historyForApi);
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const useExample = (prompt) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  return (
    <div style={{ ...styles.page, height: viewportHeight ? `${viewportHeight}px` : '100dvh' }}>
      <div style={styles.chatBox} ref={chatBoxRef} onScroll={handleScroll}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <p style={styles.emptyTitle}>Kuch pooch lein — jaise:</p>
            <div style={styles.exampleRow}>
              {EXAMPLE_PROMPTS.map((p) => (
                <button key={p} style={styles.exampleChip} onClick={() => useExample(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {msg.role === 'user' && (
              <div style={{ ...styles.bubble, ...styles.userBubble }}>{msg.content}</div>
            )}

            {msg.role === 'assistant' && (
              <>
                {msg.tool && <ToolCard tool={msg.tool} />}

                {msg.error && (
                  <div style={styles.errorCard}>
                    <strong>{errorHeadline(msg.error.kind)}</strong>
                    <p style={{ margin: '0.3rem 0 0.6rem' }}>{msg.error.message}</p>
                    <button style={styles.retryButton} onClick={retryLastMessage} disabled={isStreaming}>
                      {isStreaming ? 'Retry ho raha hai…' : 'Retry'}
                    </button>
                  </div>
                )}

                {!msg.error && msg.content && (
                  <div style={{ ...styles.bubble, ...styles.assistantBubble }}>{msg.content}</div>
                )}

                {!msg.error && !msg.content && !msg.tool && isStreaming && i === messages.length - 1 && (
                  <div style={{ ...styles.bubble, ...styles.assistantBubble, ...styles.skeletonBubble }}>
                    <span style={styles.skeletonLine} />
                    <span style={{ ...styles.skeletonLine, width: '70%' }} />
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {!isAtBottom && (
        <button
          style={styles.jumpButton}
          onClick={() => {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
            setIsAtBottom(true);
          }}
        >
          ↓ Jump to latest
        </button>
      )}

      <div style={styles.inputRow}>
        <textarea
          ref={textareaRef}
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Apna message likhein..."
          rows={1}
          disabled={isStreaming}
        />
        {isStreaming ? (
          <button style={styles.stopButton} onClick={stopStreaming}>Stop</button>
        ) : (
          <button style={styles.sendButton} onClick={() => sendMessage()}>Send</button>
        )}
      </div>
    </div>
  );
}

function errorHeadline(kind) {
  switch (kind) {
    case 'network': return 'Connection fail ho gaya';
    case 'rate_limit': return 'Rate limit lag gaya';
    case 'server': return 'Server error';
    case 'empty': return 'Jawab nahi mila';
    default: return 'Kuch ghalat ho gaya';
  }
}

// ===== Tool lifecycle component — 4 states =====
function ToolCard({ tool }) {
  if (tool.state === 'input-streaming') {
    return (
      <div style={styles.toolCard}>
        <div style={styles.skeletonLine} />
        <div style={{ ...styles.skeletonLine, width: '60%' }} />
        <span style={styles.toolLabel}>Search build ho rahi hai…</span>
      </div>
    );
  }

  if (tool.state === 'input-available') {
    return (
      <div style={{ ...styles.toolCard, ...styles.toolCardRunning }}>
        <span style={styles.spinner} />
        <span>
          "{tool.args?.query}" dhoonda ja raha hai
          {tool.args?.maxPrice ? ` ($${tool.args.maxPrice} tak)` : ''}…
        </span>
      </div>
    );
  }

  if (tool.state === 'output-error') {
    return (
      <div style={{ ...styles.toolCard, ...styles.toolCardError }}>
        <strong>Search fail ho gayi</strong>
        <p style={{ margin: '0.3rem 0 0' }}>{tool.error}</p>
      </div>
    );
  }

  if (tool.state === 'output-available') {
    return (
      <div style={styles.productGrid}>
        {tool.result.map((p) => (
          <div key={p.id} style={styles.productCard}>
            <img src={p.image} alt={p.name} style={styles.productImage} />
            <div style={{ padding: '0.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.name}</div>
              <div style={{ color: '#0084ff', fontWeight: 700 }}>${p.price}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' },
  chatBox: { flex: 1, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },

  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: '#888', textAlign: 'center', marginTop: '2rem', padding: '0 1rem' },
  emptyTitle: { margin: 0 },
  exampleRow: { display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '320px' },
  exampleChip: { padding: '0.6rem 1rem', borderRadius: '1.5rem', border: '1px solid #ddd', backgroundColor: '#f7f7f9', color: '#333', cursor: 'pointer', fontSize: '0.9rem' },

  bubble: { padding: '0.6rem 1rem', borderRadius: '1rem', maxWidth: '80%', wordWrap: 'break-word', whiteSpace: 'pre-wrap' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#0084ff', color: 'white' },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: '#e5e5ea', color: 'black' },
  skeletonBubble: { display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '120px' },

  jumpButton: { alignSelf: 'center', marginBottom: '0.5rem', padding: '0.4rem 1rem', borderRadius: '1rem', border: 'none', backgroundColor: '#333', color: 'white', cursor: 'pointer' },
  inputRow: { display: 'flex', gap: '0.5rem', padding: '0.75rem', borderTop: '1px solid #ddd' },
  input: { flex: 1, padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #ccc', resize: 'none', fontSize: '1rem' },
  sendButton: { padding: '0.6rem 1.2rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#0084ff', color: 'white', cursor: 'pointer' },
  stopButton: { padding: '0.6rem 1.2rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#ff3b30', color: 'white', cursor: 'pointer' },

  errorCard: { alignSelf: 'flex-start', backgroundColor: '#fdecea', border: '1px solid #f5c2c0', color: '#a33', borderRadius: '0.75rem', padding: '0.75rem 1rem', maxWidth: '80%' },
  retryButton: { padding: '0.4rem 1rem', borderRadius: '0.5rem', border: '1px solid #a33', backgroundColor: 'white', color: '#a33', cursor: 'pointer', fontSize: '0.85rem' },

  toolCard: { alignSelf: 'flex-start', backgroundColor: '#f0f0f3', borderRadius: '0.75rem', padding: '0.75rem 1rem', maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  toolCardRunning: { flexDirection: 'row', alignItems: 'center', gap: '0.5rem', backgroundColor: '#eaf3ff' },
  toolCardError: { backgroundColor: '#fdecea', border: '1px solid #f5c2c0', color: '#a33' },
  toolLabel: { fontSize: '0.8rem', color: '#888' },
  skeletonLine: { height: '10px', borderRadius: '4px', backgroundColor: '#ddd', width: '100%', animation: 'pulse 1.2s ease-in-out infinite' },
  spinner: { width: '14px', height: '14px', border: '2px solid #ccc', borderTopColor: '#0084ff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' },

  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.6rem', maxWidth: '90%' },
  productCard: { backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '0.6rem', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  productImage: { width: '100%', height: '90px', objectFit: 'cover' },
};

export default ChatPage;

export { ToolCard };