import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  MoreVertical,
  RotateCw,
  Send,
  Mic,
  MicOff,
  Paperclip,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Globe,
  Settings,
  Sparkles,
  ChevronDown,
} from "lucide-react";

export default function ChatPane({
  messages = [],
  onSend,
  onRegenerate,
  loading,
  filename,
  onOpenSettings,
  onAttachFile,
}) {
  const [inputQuestion, setInputQuestion] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [reactions, setReactions] = useState({});
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatScrollRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Web Speech Recognition for the microphone button
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputQuestion((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const handleToggleMic = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReaction = (id, type) => {
    setReactions((prev) => ({
      ...prev,
      [id]: prev[id] === type ? null : type,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = inputQuestion.trim();
    if (!val || loading) return;
    setInputQuestion("");
    onSend(val);
  };

  const languages = ["English", "Spanish", "French", "German", "Hindi"];

  return (
    <div className="chat-pane-container">
      {/* Top Header */}
      <div className="chat-pane-header">
        <span className="chat-pane-doc-label" title={filename || "AI Voice Changer PDF File...."}>
          {filename ? (filename.length > 25 ? filename.slice(0, 24) + "..." : filename) : "AI Voice Changer PDF File...."}
        </span>

        <div className="chat-pane-header-actions">
          <button className="chat-icon-btn" onClick={onOpenSettings} title="Backend API Settings">
            <Settings size={18} />
          </button>

          <button className="chat-icon-btn notification-btn" title="Notifications">
            <Bell size={18} />
            <span className="notification-dot" />
          </button>

          <div className="chat-user-profile">
            <div className="chat-user-avatar">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80"
                alt="Devon Lane"
                className="user-avatar-img"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <span className="user-avatar-fallback">DL</span>
            </div>
            <span className="chat-user-name">Devon Lane</span>
            <button className="chat-more-btn">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="chat-messages-area">
        {/* Welcome message */}
        <div className="chat-msg-row bot-row">
          <div className="chat-bot-avatar">
            <div className="swirl-icon-small" />
          </div>
          <div className="chat-bubble-container">
            <div className="chat-bubble bot-bubble">
              How can I help you today?
            </div>
            <span className="msg-timestamp">12:54 PM</span>
          </div>
        </div>

        {/* Dynamic messages */}
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`chat-msg-row ${isUser ? "user-row" : "bot-row"}`}
            >
              {!isUser && (
                <div className="chat-bot-avatar">
                  <div className="swirl-icon-small" />
                </div>
              )}

              <div className="chat-bubble-container">
                <div className={`chat-bubble ${isUser ? "user-bubble" : "bot-bubble"}`}>
                  <div className="bubble-text">{msg.text}</div>

                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="msg-sources-tag">
                      Sources: Pages {msg.sources.join(", ")}
                    </div>
                  )}
                </div>

                <div className="msg-meta-row">
                  <span className="msg-timestamp">{msg.time || "12:55 PM"}</span>

                  {!isUser && (
                    <div className="msg-actions">
                      <button
                        className={`action-btn ${reactions[msg.id] === "up" ? "active" : ""}`}
                        onClick={() => handleReaction(msg.id, "up")}
                        title="Good response"
                      >
                        <ThumbsUp size={13} />
                      </button>
                      <button
                        className={`action-btn ${reactions[msg.id] === "down" ? "active" : ""}`}
                        onClick={() => handleReaction(msg.id, "down")}
                        title="Poor response"
                      >
                        <ThumbsDown size={13} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title="Copy text"
                      >
                        {copiedId === msg.id ? <Check size={13} className="text-green" /> : <Copy size={13} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="chat-user-avatar-msg">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80"
                    alt="You"
                    className="avatar-msg-img"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <span className="avatar-msg-fallback">DL</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="chat-msg-row bot-row">
            <div className="chat-bot-avatar">
              <div className="swirl-icon-small pulse" />
            </div>
            <div className="chat-bubble-container">
              <div className="chat-bubble bot-bubble thinking-bubble">
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span>DocAI is analyzing document...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatScrollRef} />
      </div>

      {/* Regenerate Pill */}
      {messages.length > 0 && (
        <div className="regenerate-container">
          <button
            className="regenerate-btn"
            onClick={onRegenerate}
            disabled={loading}
          >
            <RotateCw size={14} className={loading ? "spin" : ""} />
            <span>Regenerate</span>
          </button>
        </div>
      )}

      {/* Floating Bottom Input Bar */}
      <div className="chat-input-wrapper">
        <form className="chat-input-card" onSubmit={handleSubmit}>
          <button
            type="button"
            className="input-attach-btn"
            onClick={onAttachFile}
            title="Attach or upload document"
          >
            <Paperclip size={18} />
          </button>

          <input
            type="text"
            className="chat-main-input"
            placeholder="Send a message"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={loading}
          />

          <div className="input-right-controls">
            {/* Language Selector */}
            <div className="lang-selector-relative">
              <button
                type="button"
                className="lang-selector-btn"
                onClick={() => setShowLangMenu(!showLangMenu)}
              >
                <Globe size={14} />
                <span>{selectedLanguage}</span>
                <ChevronDown size={12} />
              </button>

              {showLangMenu && (
                <div className="lang-dropdown-menu">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      className={`lang-option ${lang === selectedLanguage ? "active" : ""}`}
                      onClick={() => {
                        setSelectedLanguage(lang);
                        setShowLangMenu(false);
                      }}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!inputQuestion.trim() || loading}
              title="Send message"
            >
              <Send size={15} />
            </button>

            {/* Microphone Button */}
            <button
              type="button"
              className={`chat-mic-btn ${isListening ? "listening" : ""}`}
              onClick={handleToggleMic}
              title={isListening ? "Listening... Click to stop" : "Voice input (Speak)"}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
