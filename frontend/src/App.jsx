import React, { useState, useRef, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import DocumentViewer from "./components/DocumentViewer";
import ChatPane from "./components/ChatPane";
import ApiSettingsModal from "./components/ApiSettingsModal";
import { uploadPDF, sendQuestion, deleteDocument } from "./services/api";
import "./App.css";

function formatCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function App() {
  const [documentId, setDocumentId] = useState(null);
  const [filename, setFilename] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [messages, setMessages] = useState([
    {
      id: "initial-bot-1",
      role: "assistant",
      text: "How can I help you today?",
      time: "12:54 PM",
    },
    {
      id: "sample-user-1",
      role: "user",
      text: "Show me device setup wizard",
      time: "12:54 PM",
    },
    {
      id: "sample-bot-2",
      role: "assistant",
      text: "Setup Wizard:\nWhen you first boot up the phone (or after a factory reset), the setup wizard lets you customize all features, including language, software buttons, gestures, fingerprint unlock, and other features. If you want to change these later, you can do so after setting up the phone in the settings app.",
      time: "12:55 PM",
      sources: [1],
    },
  ]);
  const [searchHistory, setSearchHistory] = useState([
    "what are the biggest risk in plan?",
    "write a LinkedIn post about this...",
    "who will approve the final budget.",
  ]);

  const [uploadLoading, setUploadLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [highlightText, setHighlightText] = useState("Setup Wizard");

  const hiddenFileInputRef = useRef(null);

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  const handleUpload = async (file) => {
    if (!file) return;

    setUploadLoading(true);

    try {
      // Create local preview blob URL immediately
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      const localBlob = URL.createObjectURL(file);
      setPdfFile(file);
      setPdfBlobUrl(localBlob);
      setFilename(file.name);

      const result = await uploadPDF(file);
      const oldDocId = documentId;
      setDocumentId(result.document_id);
      setFilename(result.filename || file.name);
      setTotalPages(result.total_pages || 1);

      // Add a greeting for the newly uploaded document
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `I have processed "${file.name}" (${result.total_pages || 1} pages). Ask me anything about it!`,
          time: formatCurrentTime(),
        },
      ]);

      if (oldDocId) {
        deleteDocument(oldDocId).catch(() => {});
      }
    } catch (err) {
      alert(
        err.message ||
          "Upload failed. Please verify your backend is running or configured in Settings (gear icon)."
      );
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSendQuestion = async (question) => {
    if (!question.trim()) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: question,
      time: formatCurrentTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setSearchHistory((prev) => [question, ...prev.filter((q) => q !== question)]);
    setChatLoading(true);

    // If no document is uploaded yet, provide an informative response
    if (!documentId) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: "Please upload a PDF document first so I can answer questions grounded in its text! You can click '+ New Document' in the sidebar or drop a PDF into the middle viewer.",
            time: formatCurrentTime(),
          },
        ]);
        setChatLoading(false);
      }, 500);
      return;
    }

    try {
      const result = await sendQuestion(documentId, question);
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: result.answer,
        sources: result.sources || [],
        time: formatCurrentTime(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `Error: ${err.message || "Failed to reach backend."} If your backend was sleeping on Render, please wait 30 seconds and retry.`,
          time: formatCurrentTime(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleRegenerate = () => {
    // Find last user question
    const userMessages = messages.filter((m) => m.role === "user");
    if (userMessages.length > 0) {
      const lastQ = userMessages[userMessages.length - 1].text;
      handleSendQuestion(lastQ);
    }
  };

  const handleNewDocument = () => {
    hiddenFileInputRef.current?.click();
  };

  return (
    <div className="docai-app-container">
      {/* Hidden file input */}
      <input
        ref={hiddenFileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
          }
        }}
      />

      {/* Main 3-Pane Desktop Layout */}
      <div className="docai-three-pane-layout">
        {/* Left Sidebar */}
        <Sidebar
          filename={filename}
          onNewDocument={handleNewDocument}
          searchHistory={searchHistory}
          onSelectHistory={handleSendQuestion}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Center Document Viewer */}
        <DocumentViewer
          file={pdfFile}
          filename={filename}
          totalPages={totalPages}
          pdfBlobUrl={pdfBlobUrl}
          onUpload={handleUpload}
          loading={uploadLoading}
          highlightText={highlightText}
        />

        {/* Right Chat Assistant */}
        <ChatPane
          messages={messages}
          onSend={handleSendQuestion}
          onRegenerate={handleRegenerate}
          loading={chatLoading}
          filename={filename}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onAttachFile={handleNewDocument}
        />
      </div>

      {/* Backend API Configuration Modal */}
      <ApiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
