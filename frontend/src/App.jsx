import { useState } from "react";
import { FileText, RefreshCw } from "lucide-react";

import FileUpload from "./components/FileUpload";
import ChatWindow from "./components/ChatWindow";
import { uploadPDF, sendQuestion, deleteDocument } from "./services/api";
import "./App.css";

function getErrorMessage(error, fallback) {
  return (
    error.response?.data?.detail ||
    error.message ||
    fallback
  );
}

function App() {
  const [documentId, setDocumentId] = useState(null);
  const [filename, setFilename] = useState("");
  const [messages, setMessages] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleUpload(file) {
    setUploadLoading(true);
    setError("");
    setSuccess("");

    try {
      // Upload first. Keep the current document if the new upload fails.
      const result = await uploadPDF(file);

      const oldDocumentId = documentId;
      setDocumentId(result.document_id);
      setFilename(result.filename);
      setMessages([]);
      setSuccess(
        `Successfully processed ${result.total_pages} page(s) and ${result.total_chunks} text chunk(s).`
      );

      if (oldDocumentId) {
        deleteDocument(oldDocumentId).catch(() => {
          // The old in-memory document can be cleaned up when the server restarts.
        });
      }
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, "PDF upload failed. Please try again."));
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleSendQuestion(question) {
    if (!documentId || chatLoading) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: question,
    };

    setMessages((current) => [...current, userMessage]);
    setChatLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await sendQuestion(documentId, question);

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: result.answer,
        sources: result.sources || [],
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (chatError) {
      setError(getErrorMessage(chatError, "Could not get an answer. Please try again."));
    } finally {
      setChatLoading(false);
    }
  }

  async function handleNewDocument() {
    const oldDocumentId = documentId;

    setDocumentId(null);
    setFilename("");
    setMessages([]);
    setError("");
    setSuccess("");

    if (oldDocumentId) {
      try {
        await deleteDocument(oldDocumentId);
      } catch {
        // The backend may already have removed this document.
      }
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DocAI home">
          <span className="brand-mark"><FileText size={23} /></span>
          <span>
            <strong>DocAI</strong>
            <small>PDF Assistant</small>
          </span>
        </a>

      </header>

      <main className="main-content">
        <section className="hero">
          <span className="eyebrow">A calmer way to read</span>
          <h1>
            Make sense of <span>your documents.</span>
          </h1>
          <p>
            Add a PDF and ask what you’d like to know. DocAI will help you find the answer and where it appears.
          </p>
        </section>

        {error && (
          <div className="notice notice-error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="notice notice-success" role="status">
            {success}
          </div>
        )}

        {!documentId ? (
          <FileUpload onUpload={handleUpload} loading={uploadLoading} />
        ) : (
          <section className="workspace">
            <div className="document-toolbar">
              <div className="document-detail">
                <span className="document-icon"><FileText size={20} /></span>
                <div>
                  <strong>{filename}</strong>
                  <small>Uploaded and processed</small>
                </div>
              </div>

              <button
                type="button"
                className="button button-light"
                onClick={handleNewDocument}
                disabled={chatLoading}
              >
                <RefreshCw size={15} />
                New PDF
              </button>
            </div>

            <ChatWindow
              messages={messages}
              onSend={handleSendQuestion}
              loading={chatLoading}
              filename={filename}
            />
          </section>
        )}
      </main>

      <footer className="footer">
        Your document stays in this session.
      </footer>
    </div>
  );
}

export default App;
