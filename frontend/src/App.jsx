import React, { useState, useRef, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import DocumentViewer from "./components/DocumentViewer";
import ChatPane from "./components/ChatPane";
import ApiSettingsModal from "./components/ApiSettingsModal";
import ProfileModal from "./components/ProfileModal";
import { uploadPDF, sendQuestion, deleteDocument } from "./services/api";
import {
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
} from "./services/storage";
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

const DEFAULT_WELCOME_MSG = {
  id: "welcome-init",
  role: "assistant",
  text: "Welcome to DocAI! Upload a PDF document to begin asking questions and exploring insights.",
  time: formatCurrentTime(),
};

function App() {
  const [documentId, setDocumentId] = useState(null);
  const [filename, setFilename] = useState("");
  const [uploadDate, setUploadDate] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [messages, setMessages] = useState([DEFAULT_WELCOME_MSG]);

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
  const restoredSessionRef = useRef(false);

  // 1. Restore document session from IndexedDB on page load / refresh
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const session = await loadActiveSession();
        if (session && isMounted) {
          restoredSessionRef.current = true;
          setDocumentId(session.documentId);
          setFilename(session.filename);
          setUploadDate(session.uploadDate || "");
          setTotalPages(session.totalPages || 1);

          if (session.messages && session.messages.length > 0) {
            setMessages(session.messages);
          }

          if (session.fileBlob) {
            setPdfFile(session.fileBlob);
            const objectUrl = URL.createObjectURL(session.fileBlob);
            setPdfBlobUrl(objectUrl);
          }
        }
      } catch (err) {
        console.warn("Could not restore session from storage:", err);
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Persist active document session whenever it changes
  useEffect(() => {
    if (documentId && pdfFile) {
      saveActiveSession({
        documentId,
        filename,
        uploadDate,
        totalPages,
        fileBlob: pdfFile,
        messages,
      });
    }
  }, [documentId, filename, uploadDate, totalPages, pdfFile, messages]);

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
      const newMessages = [
        ...messages.filter((m) => m.id !== "welcome-init"),
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `Successfully uploaded and processed "${file.name}" (${result.total_pages || 1} pages, ${result.total_chunks || 1} chunks). Ask me anything about it!`,
          time: formatCurrentTime(),
        },
      ];
      setMessages(newMessages);

      // Save to IndexedDB immediately
      saveActiveSession({
        documentId: result.document_id,
        filename: result.filename || file.name,
        uploadDate: formattedDate,
        totalPages: result.total_pages || 1,
        fileBlob: file,
        messages: newMessages,
      });

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
      let activeDocId = documentId;

      let result;
      try {
        result = await sendQuestion(activeDocId, question);
      } catch (firstErr) {
        // If backend was restarted and lost in-memory index, auto-reupload saved blob in background!
        const errMsg = String(firstErr.message || "").toLowerCase();
        if (pdfFile && (errMsg.includes("not found") || errMsg.includes("404"))) {
          try {
            const reUp = await uploadPDF(pdfFile);
            activeDocId = reUp.document_id;
            setDocumentId(reUp.document_id);
            result = await sendQuestion(reUp.document_id, question);
          } catch (reErr) {
            throw firstErr;
          }
        } else {
          throw firstErr;
        }
      }

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
    const resetMsg = [
      {
        id: "cleared-init",
        role: "assistant",
        text: filename
          ? `Chat cleared. Ask me any question about "${filename}".`
          : "Chat cleared. Upload a PDF to start a new Q&A session.",
        time: formatCurrentTime(),
      },
    ];
    setMessages(resetMsg);
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

  const handleCloseActiveDocument = async () => {
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
    }
    const oldId = documentId;
    setDocumentId(null);
    setFilename("");
    setPdfFile(null);
    setPdfBlobUrl(null);
    setUploadDate("");
    setMessages([DEFAULT_WELCOME_MSG]);
    await clearActiveSession();
    if (oldId) {
      deleteDocument(oldId).catch(() => {});
    }
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
          onCloseDocument={handleCloseActiveDocument}
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
