export function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("docai_api_url");
    // Clear out the invalid third-party URL if it was accidentally saved
    if (saved && saved.includes("docai-backend.onrender.com")) {
      localStorage.removeItem("docai_api_url");
    } else if (saved && saved.trim()) {
      return saved.trim().replace(/\/$/, "");
    }

    // If running on localhost / 127.0.0.1, ALWAYS use the local backend!
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") {
      return "http://127.0.0.1:8000";
    }
  }

  // In cloud production, use configured VITE_API_URL or default to empty for reverse proxy
  return (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
}

export function setApiBaseUrl(url) {
  if (typeof window !== "undefined") {
    if (url && url.trim()) {
      localStorage.setItem("docai_api_url", url.trim().replace(/\/$/, ""));
    } else {
      localStorage.removeItem("docai_api_url");
    }
  }
}

async function request(path, options) {
  const baseUrl = getApiBaseUrl();
  const url = baseUrl ? `${baseUrl}${path}` : path;
  let response;

  try {
    response = await fetch(url, options);
  } catch (err) {
    const targetMsg = baseUrl || "local backend (http://127.0.0.1:8000)";
    throw new Error(
      `Cannot connect to backend at ${targetMsg}. Please make sure your backend is running, or configure your API URL via Settings (gear icon).`
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || `Request failed (${response.status}). Please try again.`);
  }
  return payload;
}

// Health check
export const checkHealth = async () => {
  return request("/health", { method: "GET" });
};

// Upload PDF document
export const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return request("/upload", {
    method: "POST",
    body: formData,
  });
};

// Send question to chatbot
export const sendQuestion = async (documentId, question) => {
  return request("/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question: question,
      document_id: documentId,
    }),
  });
};

// Delete uploaded document
export const deleteDocument = async (documentId) => {
  return request(`/documents/${encodeURIComponent(documentId)}`, { method: "DELETE" });
};
