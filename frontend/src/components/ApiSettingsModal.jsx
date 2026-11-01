import React, { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, RefreshCw, Zap } from "lucide-react";
import {
  getApiBaseUrl,
  setApiBaseUrl,
  checkHealth,
  getGroqApiKey,
  setGroqApiKey,
} from "../services/api";

const DEFAULT_CLOUD_URL = "https://docai-backend-xpnh.onrender.com";

export default function ApiSettingsModal({ isOpen, onClose }) {
  const [url, setUrl] = useState(() => getApiBaseUrl() || DEFAULT_CLOUD_URL);
  const [groqKey, setGroqKey] = useState(getGroqApiKey);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message: string }
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrl(getApiBaseUrl() || DEFAULT_CLOUD_URL);
      setGroqKey(getGroqApiKey());
      setStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    const targetUrl = (url || DEFAULT_CLOUD_URL).trim().replace(/\/$/, "");
    setTesting(true);
    setStatus(null);
    try {
      setApiBaseUrl(targetUrl);
      const res = await checkHealth();
      setStatus({
        type: "success",
        message: `Connected! Backend status: ${res.status || "healthy"} (Embedding model loaded: ${res.embedding_model_loaded ? "Yes" : "No"})`,
      });
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Failed to reach backend at this URL.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const targetUrl = (url || DEFAULT_CLOUD_URL).trim().replace(/\/$/, "");
    setApiBaseUrl(targetUrl);
    setGroqApiKey(groqKey);
    onClose();
    window.location.reload();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Backend & AI Configuration</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-desc">
            Connect this frontend to your deployed Render backend.
          </p>

          <div className="modal-tip" style={{ marginBottom: "16px", background: "#eff6ff", borderColor: "#bfdbfe", color: "#1e40af" }}>
            <strong>How to get your Render URL:</strong>
            <ol style={{ paddingLeft: "18px", marginTop: "6px", lineHeight: "1.6" }}>
              <li>Open your <a href="https://dashboard.render.com" target="_blank" rel="noreferrer" style={{ textDecoration: "underline", color: "#2563eb", fontWeight: "600" }}>Render Dashboard</a>.</li>
              <li>Click on your service (<strong>docai-backend</strong>).</li>
              <li>Copy the URL displayed directly below the title (looks like <code>https://docai-backend-xxxx.onrender.com</code>).</li>
              <li>Paste it in the box below, click <strong>Test</strong>, then <strong>Save & Apply</strong>!</li>
            </ol>
          </div>

          {/* Backend API URL */}
          <label className="modal-label">Render Backend API URL</label>
          <div className="modal-input-row">
            <input
              type="text"
              className="modal-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docai-backend-xxxx.onrender.com"
            />

            <button
              type="button"
              className="modal-test-btn"
              onClick={handleTest}
              disabled={testing || !url.trim()}
            >
              {testing ? <RefreshCw size={14} className="spin" /> : "Test"}
            </button>
          </div>

          {/* Groq API Key for Fast Answers */}
          <label className="modal-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Zap size={14} color="#f59e0b" />
            Groq API Key (Optional — For Instant &lt;1s Answers)
          </label>
          <div className="modal-input-row">
            <input
              type="password"
              className="modal-input"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="gsk_... (Leave blank to use local Ollama)"
            />
          </div>
          <p style={{ fontSize: "11.5px", color: "#64748b", margin: "-6px 0 14px", lineHeight: "1.4" }}>
            Get a free key at{" "}
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#2563eb", textDecoration: "underline" }}
            >
              console.groq.com/keys
            </a>{" "}
            to answer in <strong>under 1 second</strong>! If left blank, local Ollama model is used.
          </p>

          {status && (
            <div className={`modal-status ${status.type}`}>
              {status.type === "success" ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              <span>{status.message}</span>
            </div>
          )}

          <div className="modal-tip">
            <strong>Speed Tip:</strong> Running AI locally on CPU can take 15–20 seconds per question. Adding a free Groq key speeds up responses to <strong>less than 1 second</strong>.
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="modal-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="modal-save-btn" onClick={handleSave}>
            Save & Apply
          </button>
        </div>
      </div>
    </div>
  );
}
