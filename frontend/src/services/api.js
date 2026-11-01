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

  // In cloud production, use configured VITE_API_URL or default to your live Render service
  return (
    import.meta.env.VITE_API_URL || "https://docai-backend-xpnh.onrender.com"
  ).replace(/\/$/, "");
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

  // If on cloud/Vercel and no backend URL is set, alert the user with actionable instructions
  if (
    !baseUrl &&
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    throw new Error(
      "Backend URL is not configured yet! Click the Settings (⚙️ gear icon) at the top right, paste your Render backend URL (e.g. https://docai-backend-xxxx.onrender.com), and click Save."
    );
  }

  const url = baseUrl ? `${baseUrl}${path}` : path;
  let response;

  try {
    response = await fetch(url, options);
  } catch (err) {
    const targetMsg = baseUrl || "http://127.0.0.1:8000";
    throw new Error(
      `Cannot connect to backend at ${targetMsg}. If using Render free tier, please wait 40-50s for it to wake up from idle, or check Settings (⚙️ gear icon).`
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 404 && (!baseUrl || (typeof window !== "undefined" && baseUrl.includes(window.location.hostname)))) {
      throw new Error(
        "Backend not found on this domain. Please click Settings (⚙️ gear icon) at the top right and enter your Render backend URL."
      );
    }
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

export function getGroqApiKey() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("docai_groq_key") || "";
  }
  return "";
}

export function setGroqApiKey(key) {
  if (typeof window !== "undefined") {
    if (key && key.trim()) {
      localStorage.setItem("docai_groq_key", key.trim());
    } else {
      localStorage.removeItem("docai_groq_key");
    }
  }
}

// Send question to chatbot
export const sendQuestion = async (documentId, question) => {
  const groqKey = getGroqApiKey();
  const headers = {
    "Content-Type": "application/json",
  };
  if (groqKey) {
    headers["X-Groq-Api-Key"] = groqKey;
  }

  return request("/chat", {
    method: "POST",
    headers,
    body: JSON.stringify({
      question: question,
      document_id: documentId,
      groq_api_key: groqKey || null,
    }),
  });
};

// Delete uploaded document
export const deleteDocument = async (documentId) => {
  return request(`/documents/${encodeURIComponent(documentId)}`, { method: "DELETE" });
};
