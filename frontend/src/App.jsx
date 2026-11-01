import React, { useState, useRef, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import DocumentViewer from "./components/DocumentViewer";
import ChatPane from "./components/ChatPane";
import ApiSettingsModal from "./components/ApiSettingsModal";
import ProfileModal from "./components/ProfileModal";
import { uploadPDF, sendQuestion, deleteDocument } from "./services/api";
import "./App.css";

function formatCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getStoredProfile() {
  if (typeof window !== "undefined") {
    try {
      const data = localStorage.getItem("docai_user_profile");
      if (data) return JSON.parse(data);
    } catch {}
  }
  return {
    name: "Tejaswi Munthala",
    email: "mltejaswi1@gmail.com",
  };
}

function getStoredHistory() {
  if (typeof window !== "undefined") {
    try {
      const data = localStorage.getItem("docai_search_history");
      if (data) return JSON.parse(data);
    } catch {}
  }
  return [];
}

function App() {
  const [documentId, setDocumentId] = useState(null);
  const [filename, setFilename] = useState("");
  const [uploadDate, setUploadDate] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  // Clean initial messages - No dummy data
  const [messages, setMessages] = useState([
    {
      id: "welcome-init",
      role: "assistant",
      text: "Welcome to DocAI! Upload a PDF document to begin asking questions and exploring insights.",
      time: formatCurrentTime(),
    },
  ]);

  // Real search history stored in localStorage
  const [searchHistory, setSearchHistory] = useState(getStoredHistory);

  // Real user profile stored in localStorage
  const [profile, setProfile] = useState(getStoredProfile);

  const [uploadLoading, setUploadLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const hiddenFileInputRef = useRef(null);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  // Save history changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("docai_search_history", JSON.stringify(searchHistory));
    } catch {}
  }, [searchHistory]);

  // Save profile changes to localStorage
  const handleSaveProfile = (newProfile) => {
    setProfile(newProfile);
    try {
      localStorage.setItem("docai_user_profile", JSON.stringify(newProfile));
    } catch {}
  };

  const handleUpload = async (file) => {
    if (!file) return;

    setUploadLoading(true);
    let localBlob = null;

    try {
      localBlob = URL.createObjectURL(file);

      const result = await uploadPDF(file);
      const oldDocId = documentId;

      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }

      setPdfFile(file);
      setPdfBlobUrl(localBlob);
      setDocumentId(result.document_id);
      setFilename(result.filename || file.name);
      setTotalPages(result.total_pages || 1);

      const formattedDate = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      setUploadDate(formattedDate);

      // Add a greeting for the newly uploaded document
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `Successfully uploaded and processed "${file.name}" (${result.total_pages || 1} pages, ${result.total_chunks || 1} chunks). Ask me anything about it!`,
          time: formatCurrentTime(),
        },
      ]);

      if (oldDocId) {
        deleteDocument(oldDocId).catch(() => {});
      }
    } catch (err) {
      if (localBlob) {
        URL.revokeObjectURL(localBlob);
      }
      setPdfFile(null);
      setPdfBlobUrl(null);
      setFilename("");

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `Upload failed: ${err.message || "Request failed."} Please make sure your backend is running or check the Settings (gear icon) at the top right.`,
          time: formatCurrentTime(),
        },
      ]);
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

    // Save real query to search history
    const historyItem = {
      id: crypto.randomUUID(),
      query: question,
      timestamp: Date.now(),
    };
    setSearchHistory((prev) => [
      historyItem,
      ...prev.filter((item) => (typeof item === "string" ? item : item.query) !== question),
    ]);

    setChatLoading(true);

    if (!documentId) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: "Please upload a PDF document first so I can answer questions grounded in its text! You can click '+ New Document' or drop a file in the center viewer.",
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
          text: `Error: ${err.message || "Failed to reach backend."} If using Render free tier, please wait 30 seconds for the backend to wake up and try again.`,
          time: formatCurrentTime(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleRegenerate = () => {
    const userMessages = messages.filter((m) => m.role === "user");
    if (userMessages.length > 0) {
      const lastQ = userMessages[userMessages.length - 1].text;
      handleSendQuestion(lastQ);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "cleared-init",
        role: "assistant",
        text: filename
          ? `Chat cleared. Ask me any question about "${filename}".`
          : "Chat cleared. Upload a PDF to start a new Q&A session.",
        time: formatCurrentTime(),
      },
    ]);
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem("docai_search_history");
    } catch {}
  };

  const handleDeleteHistoryItem = (id) => {
    setSearchHistory((prev) => prev.filter((item) => (item.id || item) !== id));
  };

  const handleNewDocument = () => {
    hiddenFileInputRef.current?.click();
  };

  return (
    <div className="docai-app-container">
      {/* Hidden file input for file selection */}
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
          uploadDate={uploadDate}
          onNewDocument={handleNewDocument}
          searchHistory={searchHistory}
          onSelectHistory={handleSendQuestion}
          onDeleteHistoryItem={handleDeleteHistoryItem}
          onClearHistory={handleClearHistory}
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
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Right Chat Assistant */}
        <ChatPane
          messages={messages}
          onSend={handleSendQuestion}
          onRegenerate={handleRegenerate}
          onClearChat={handleClearChat}
          loading={chatLoading}
          filename={filename}
          profile={profile}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onAttachFile={handleNewDocument}
        />
      </div>

      {/* Backend API Configuration Modal */}
      <ApiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* User Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
      />
    </div>
  );
}

export default App;
