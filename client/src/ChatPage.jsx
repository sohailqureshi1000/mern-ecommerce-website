import { useState, useRef, useEffect } from 'react';

function ChatPage() {
  const [messages, setMessages] = useState([]); // {role, content} ki list
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true); // auto-scroll ke liye

  const chatBoxRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Jab bhi messages update hon, agar user bottom pe hai to scroll kar do
  useEffect(() => {
    if (isAtBottom && chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isAtBottom]);

  // User ne scroll kiya to check karo woh bottom pe hai ya nahi
  const handleScroll = () => {
    const box = chatBoxRef.current;
    if (!box) return;
    const threshold = 50; // 50px tak "bottom" mana jayega
    const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < threshold;
    setIsAtBottom(atBottom);
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    // Ek khaali assistant message add kar do, jisme hum tokens jodte jayenge
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('https://sohail-fe06-server.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
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
        buffer = lines.pop(); // aakhri (adhoori) line agli baar ke liye rakh lo

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') continue;

          const { token } = JSON.parse(dataStr);
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: updated[updated.length - 1].content + token,
            };
            return updated;
          });
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Stream error:', err);
      }
      // AbortError ho ya normal error, partial message wahin reh jayega — delete nahi karte
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
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
        {messages.length === 0 && (
          <div style={styles.emptyState}>Kuch pooch lein...</div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.bubble,
              ...(msg.role === 'user' ? styles.userBubble : styles.assistantBubble),
            }}
          >
            {msg.content || (isStreaming && i === messages.length - 1 ? '...' : '')}
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
          <button style={styles.stopButton} onClick={stopStreaming}>
            Stop
          </button>
        ) : (
          <button style={styles.sendButton} onClick={sendMessage}>
            Send
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxWidth: '600px',
    margin: '0 auto',
    fontFamily: 'sans-serif',
  },
  chatBox: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  emptyState: {
    color: '#888',
    textAlign: 'center',
    marginTop: '2rem',
  },
  bubble: {
    padding: '0.6rem 1rem',
    borderRadius: '1rem',
    maxWidth: '80%',
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0084ff',
    color: 'white',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e5ea',
    color: 'black',
  },
  jumpButton: {
    alignSelf: 'center',
    marginBottom: '0.5rem',
    padding: '0.4rem 1rem',
    borderRadius: '1rem',
    border: 'none',
    backgroundColor: '#333',
    color: 'white',
    cursor: 'pointer',
  },
  inputRow: {
    display: 'flex',
    gap: '0.5rem',
    padding: '0.75rem',
    borderTop: '1px solid #ddd',
  },
  input: {
    flex: 1,
    padding: '0.6rem',
    borderRadius: '0.5rem',
    border: '1px solid #ccc',
    resize: 'none',
    fontSize: '1rem',
  },
  sendButton: {
    padding: '0.6rem 1.2rem',
    borderRadius: '0.5rem',
    border: 'none',
    backgroundColor: '#0084ff',
    color: 'white',
    cursor: 'pointer',
  },
  stopButton: {
    padding: '0.6rem 1.2rem',
    borderRadius: '0.5rem',
    border: 'none',
    backgroundColor: '#ff3b30',
    color: 'white',
    cursor: 'pointer',
  },
};

export default ChatPage;