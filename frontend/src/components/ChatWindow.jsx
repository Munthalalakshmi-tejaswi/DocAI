import { useEffect, useRef, useState } from "react";
import { Bot, Send } from "lucide-react";
import Message from "./Message";

function ChatWindow({ messages, onSend, loading, filename }) {
  const [question, setQuestion] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleSubmit(event) {
    event.preventDefault();
    const value = question.trim();

    if (!value || loading) return;

    setQuestion("");
    onSend(value);
  }

  return (
    <section className="chat-card">
      <header className="chat-header">
        <div>
          <h2>Ask your document</h2>
          <p className="chat-filename">{filename}</p>
        </div>
        <span className="ready-label">
          <span className="status-dot" />
          Document ready
        </span>
      </header>

      <div className="chat-messages" aria-live="polite">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-chat-icon"><Bot size={32} /></div>
            <h3>What would you like to know?</h3>
            <p>Ask a question in your own words. You can start with:</p>
            <button type="button" className="suggestion" onClick={() => onSend("Can you summarize this document?")} disabled={loading}>
              “Can you summarize this document?”
            </button>
          </div>
        ) : (
          messages.map((message) => (
            <Message key={message.id} message={message} />
          ))
        )}

        {loading && (
          <div className="thinking">
            <span className="thinking-dot" />
            DocAI is finding an answer...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSubmit}>
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a question about this document..."
          aria-label="Your question"
          disabled={loading}
          maxLength={2000}
        />
        <button
          type="submit"
          className="send-button"
          disabled={!question.trim() || loading}
          aria-label="Send question"
        >
          <Send size={18} />
        </button>
      </form>
      <p className="chat-disclaimer">
        AI-generated answers may be inaccurate. Check important information in the original PDF.
      </p>
    </section>
  );
}

export default ChatWindow;
