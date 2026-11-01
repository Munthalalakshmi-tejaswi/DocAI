export function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("docai_api_url");
    if (saved && saved.trim()) return saved.trim().replace(/\/$/, "");
  }
  return (import.meta.env.VITE_API_URL || "https://docai-backend.onrender.com").replace(/\/$/, "");
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
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, options);
  } catch (err) {
    throw new Error(
      `Cannot connect to backend at ${baseUrl}. If using Render free tier, it may take 40-50s to wake up from idle. Check settings or verify backend status.`
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
