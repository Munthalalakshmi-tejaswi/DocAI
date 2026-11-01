import React, { useState } from "react";
import { X, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { getApiBaseUrl, setApiBaseUrl, checkHealth } from "../services/api";

export default function ApiSettingsModal({ isOpen, onClose }) {
  const [url, setUrl] = useState(getApiBaseUrl());
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message: string }
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setStatus(null);
    try {
      setApiBaseUrl(url);
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
    setApiBaseUrl(url);
    onClose();
    window.location.reload();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Backend API Configuration</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-desc">
            Connect this frontend to your deployed Render backend (e.g. <code>https://docai-backend-xxxx.onrender.com</code>) or local backend (<code>http://127.0.0.1:8000</code>).
          </p>

          <label className="modal-label">API Base URL</label>
          <div className="modal-input-row">
            <input
              type="text"
              className="modal-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-backend.onrender.com"
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
            <strong>Tip:</strong> If using Render's free tier, the backend spins down after 15 minutes of inactivity. It can take ~40–50 seconds to wake up on the first request.
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
