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
  User,
  Trash2,
  FilePlus,
  LogOut,
} from "lucide-react";

export default function ChatPane({
  messages = [],
  onSend,
  onRegenerate,
  onClearChat,
  loading,
  filename,
  profile,
  onOpenProfile,
  onOpenSettings,
  onAttachFile,
  onCloseDocument,
}) {

  const [inputQuestion, setInputQuestion] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [reactions, setReactions] = useState({});
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatScrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Web Speech Recognition
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

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

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
      } catch {
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

  const getInitials = (n) => {
    return (n || "User")
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  const languages = ["English", "Spanish", "French", "German", "Hindi"];

  return (
    <div className="chat-pane-container">
      {/* Top Header */}
      <div className="chat-pane-header">
        <span className="chat-pane-doc-label" title={filename || "DocAI Chat"}>
          {filename ? (filename.length > 25 ? filename.slice(0, 24) + "..." : filename) : "DocAI Chat"}
        </span>

        <div className="chat-pane-header-actions">
          <button className="chat-icon-btn" onClick={onOpenSettings} title="Backend API Settings">
            <Settings size={18} />
          </button>

          <button className="chat-icon-btn notification-btn" title="Notifications">
            <Bell size={18} />
          </button>

          {/* Interactive Profile & Three Dots Menu */}
          <div className="profile-dropdown-container" ref={profileMenuRef}>
            <div
              className="chat-user-profile"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              title="Profile & Options"
            >
              <div className="chat-user-avatar">
                <span className="user-avatar-initials">
                  {getInitials(profile?.name)}
                </span>
              </div>
              <span className="chat-user-name">{profile?.name || "User"}</span>
              <button
                type="button"
                className="chat-more-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileMenu(!showProfileMenu);
                }}
              >
                <MoreVertical size={16} />
              </button>
            </div>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="profile-menu-popup">
                <div className="profile-menu-header">
                  <div className="menu-avatar-small">
                    {getInitials(profile?.name)}
                  </div>
                  <div className="menu-header-info">
                    <strong>{profile?.name || "User"}</strong>
                    {profile?.email ? <small>{profile.email}</small> : <small style={{ opacity: 0.6 }}>DocAI Account</small>}
                  </div>
                </div>

                <div className="profile-menu-divider" />

                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenProfile();
                  }}
                >
                  <User size={15} />
                  <span>Edit Profile</span>
                </button>

                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenSettings();
                  }}
                >
                  <Settings size={15} />
                  <span>API Configuration</span>
                </button>

                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onAttachFile();
                  }}
                >
                  <FilePlus size={15} />
                  <span>Upload New PDF</span>
                </button>

                <button
                  type="button"
                  className="profile-menu-item danger"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onClearChat();
                  }}
                >
                  <Trash2 size={15} />
                  <span>Clear Chat Messages</span>
                </button>

                {filename && onCloseDocument && (
                  <button
                    type="button"
                    className="profile-menu-item danger"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onCloseDocument();
                    }}
                  >
                    <LogOut size={15} />
                    <span>Close Current PDF</span>
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="chat-messages-area">
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
                  <span className="msg-timestamp">{msg.time}</span>

                  {!isUser && (
                    <div className="msg-actions">
                      <button
                        className={`action-btn ${reactions[msg.id] === "up" ? "active" : ""}`}
                        onClick={() => handleReaction(msg.id, "up")}
                        title="Helpful"
                      >
                        <ThumbsUp size={13} />
                      </button>
                      <button
                        className={`action-btn ${reactions[msg.id] === "down" ? "active" : ""}`}
                        onClick={() => handleReaction(msg.id, "down")}
                        title="Not helpful"
                      >
                        <ThumbsDown size={13} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check size={13} className="text-green" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="chat-user-avatar-msg">
                  <span className="avatar-msg-initials">
                    {getInitials(profile?.name)}
                  </span>
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
                <span>DocAI is searching and generating answer...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatScrollRef} />
      </div>

      {/* Regenerate Pill (Only when there are user questions) */}
      {messages.some((m) => m.role === "user") && (
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
            placeholder={filename ? "Ask a question about this document..." : "Upload a PDF first to ask questions"}
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
