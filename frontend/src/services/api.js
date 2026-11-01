
const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new Error("Can't reach DocAI right now. Check that the backend is running and try again.");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || `Request failed (${response.status}). Please try again.`);
  }
  return payload;
}

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
