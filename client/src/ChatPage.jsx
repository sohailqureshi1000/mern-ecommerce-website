import { useState, useRef, useEffect } from 'react';

function ChatPage() {
  const [messages, setMessages] = useState([]); // {role, content, tool} ki list
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const chatBoxRef = useRef(null);
  const abortControllerRef = useRef(null);

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

  // Assistant message ke tool field ko update karne ka helper
  const updateAssistantTool = (updater) => {
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      updated[updated.length - 1] = {
        ...last,
        tool: updater(last.tool),
      };
      return updated;
    });
  };

  const appendToken = (token) => {
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      updated[updated.length - 1] = { ...last, content: last.content + token };
      return updated;
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    const apiMessages = newMessages.map(({ role, content }) => ({ role, content }));
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    setMessages((prev) => [...prev, { role: 'assistant', content: '', tool: null }]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
const API_URL = import.meta.env.DEV
  ? 'http://localhost:5000/api/chat'
  : 'https://sohail-fe06-server.vercel.app/api/chat';

const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
        signal: controller.signal,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
            continue;
          }

          // Tool lifecycle events
          if (parsed.type === 'tool-start') {
            updateAssistantTool(() => ({ name: parsed.tool, state: 'input-streaming' }));
          } else if (parsed.type === 'tool-input') {
            updateAssistantTool((t) => ({ ...t, state: 'input-available', args: parsed.args }));
          } else if (parsed.type === 'tool-result') {
            updateAssistantTool((t) => ({ ...t, state: 'output-available', result: parsed.result }));
          } else if (parsed.type === 'tool-error') {
            updateAssistantTool((t) => ({ ...t, state: 'output-error', error: parsed.error }));
          } else if (parsed.token) {
            appendToken(parsed.token);
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Stream error:', err);
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
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

  return (
    <div style={styles.page}>
      <div style={styles.chatBox} ref={chatBoxRef} onScroll={handleScroll}>
        {messages.length === 0 && <div style={styles.emptyState}>Kuch pooch lein...</div>}
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {msg.role === 'user' && (
              <div style={{ ...styles.bubble, ...styles.userBubble }}>{msg.content}</div>
            )}

            {msg.role === 'assistant' && (
              <>
                {msg.tool && <ToolCard tool={msg.tool} />}
                {msg.content && (
                  <div style={{ ...styles.bubble, ...styles.assistantBubble }}>{msg.content}</div>
                )}
                {!msg.content && !msg.tool && isStreaming && i === messages.length - 1 && (
                  <div style={{ ...styles.bubble, ...styles.assistantBubble }}>...</div>
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
          <button style={styles.sendButton} onClick={sendMessage}>Send</button>
        )}
      </div>
    </div>
  );
}

// ===== Tool lifecycle component — yehi 4 states render karta hai =====
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
          “{tool.args?.query}” dhoonda ja raha hai
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
  page: { display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' },
  chatBox: { flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  emptyState: { color: '#888', textAlign: 'center', marginTop: '2rem' },
  bubble: { padding: '0.6rem 1rem', borderRadius: '1rem', maxWidth: '80%', wordWrap: 'break-word', whiteSpace: 'pre-wrap' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#0084ff', color: 'white' },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: '#e5e5ea', color: 'black' },
  jumpButton: { alignSelf: 'center', marginBottom: '0.5rem', padding: '0.4rem 1rem', borderRadius: '1rem', border: 'none', backgroundColor: '#333', color: 'white', cursor: 'pointer' },
  inputRow: { display: 'flex', gap: '0.5rem', padding: '0.75rem', borderTop: '1px solid #ddd' },
  input: { flex: 1, padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #ccc', resize: 'none', fontSize: '1rem' },
  sendButton: { padding: '0.6rem 1.2rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#0084ff', color: 'white', cursor: 'pointer' },
  stopButton: { padding: '0.6rem 1.2rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#ff3b30', color: 'white', cursor: 'pointer' },

  // Tool states
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