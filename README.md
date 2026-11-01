# 📄 DocAI – Modern AI-Powered PDF Question Answering Platform

[![Live Demo](https://img.shields.io/badge/Demo-Live_on_Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://doc-ai-uva5.vercel.app/)
[![React](https://img.shields.io/badge/Frontend-React_18_%7C_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![FAISS](https://img.shields.io/badge/Vector_DB-FAISS-00599C?style=for-the-badge)](https://github.com/facebookresearch/faiss)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

> A full-stack, enterprise-grade Retrieval-Augmented Generation (RAG) platform with a modern 3-pane SaaS dashboard. Upload any PDF document, view it natively side-by-side with zoom and pagination controls, and get accurate, 100% document-grounded answers citing exact source pages.

---

## 🌟 Live Demo

- **Frontend URL:** [https://doc-ai-uva5.vercel.app/](https://doc-ai-uva5.vercel.app/)
- **Swagger API Docs (Local):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 📸 Key Features

### 1. 🖥️ Modern 3-Pane SaaS Layout
- **Left Sidebar**: Dark navy theme (`#090E1A`), brand header, **"+ New Document"** action, real-time question search, active document card, and chronological search history (**Today**, **Previous 7 Days**, **Previous 30 Days**).
- **Collapsible Sidebar**: Easily collapse (`<<`) for distraction-free reading, and expand back (`>>`) with a single click.
- **Center Document Viewer**: Natively renders uploaded PDFs with interactive zoom (`-`, `100%`, `+`) and page navigation (`<`, `Page 1 of N`, `>`).
- **Right AI Chat Assistant**: Conversational assistant with bot swirl avatar, user initials, message copy with checkmark feedback, 👍 / 👎 reactions, and a **"🔄 Regenerate"** action.

### 2. ⚡ Dual AI Acceleration Engine
- **Cloud Mode (< 1s responses)**: Powered by **Groq Cloud API** (`llama-3.1-8b-instant`), delivering instant answers at 300+ tokens/second.
- **Local Mode (100% Offline & Private)**: Native support for **Ollama** (`llama3.2:3b`) with multi-threaded CPU tuning for offline environments.

### 3. 🎯 100% Document-Grounded Accuracy
- Extracted text chunks are vectorized using `sentence-transformers/all-MiniLM-L6-v2` and indexed via **FAISS** inner-product cosine similarity.
- The model is strictly prompted to answer **only** based on the provided document context, preventing hallucinations and citing exact source pages (e.g., `[Page 1, 2]`).

### 4. 💾 Document Persistence Across Refreshes (IndexedDB)
- Uses browser **IndexedDB** to store the binary PDF file, upload metadata, and active chat thread.
- Refreshing the page (`F5`) or reopening the browser tab preserves your active document, viewing position, and chat history.
- **Auto-Reindexing**: If the backend server ever restarts or spins down, the frontend automatically re-indexes your saved document in the background when you ask a question.

### 5. 🎤 Voice Recognition & Multi-Language
- **Interactive Microphone**: Web Speech API integration allows speaking questions directly to the chatbot.
- **Language Selector**: Choose preferred language for chat interface (English, Spanish, French, German, Hindi).

### 6. 👤 Interactive Profile & 3-Dots Menu
- Click the profile avatar or **Three Dots (⋮)** in the top right to:
  - 👤 **Edit Profile**: Customize your Full Name and Email address (persisted in `localStorage`).
  - ⚙️ **API Configuration**: Test or update your Backend API URL and Groq API key in real-time.
  - 📄 **Upload New PDF**: Pick a new document to analyze.
  - 🗑️ **Clear Chat**: Reset the conversation thread.
  - 🚪 **Close Current PDF**: Safely unload the active document and clear IndexedDB.

---

## 🏗️ Architecture & Technology Stack

```text
┌────────────────────────────────────────────────────────────────────────┐
│                              DocAI System                              │
├───────────────────────────────┬────────────────────────────────────────┤
│ React 18 + Vite (Frontend)    │ • 3-Pane Responsive Layout (CSS Grid)  │
│                               │ • Native PDF Embedding & Zoom Toolbar  │
│                               │ • IndexedDB Session Persistence        │
│                               │ • Web Speech API Voice Input           │
├───────────────────────────────┼────────────────────────────────────────┤
│ FastAPI + Uvicorn (Backend)   │ • Asynchronous RESTful Endpoints       │
│                               │ • CORS Middleware (Wildcard / Custom)  │
│                               │ • In-Memory Vector Store Management    │
├───────────────────────────────┼────────────────────────────────────────┤
│ Retrieval-Augmented Gen (RAG) │ • PyPDF Text Extraction                │
│                               │ • sentence-transformers/all-MiniLM-L6  │
│                               │ • FAISS Vector Search (L2 Normalization│
├───────────────────────────────┼────────────────────────────────────────┤
│ LLM Inference                 │ • Groq Cloud API (Free, < 1s)          │
│                               │ • Local Ollama (llama3.2:3b on CPU/GPU)│
└───────────────────────────────┴────────────────────────────────────────┘
```

---

## 📁 Project Structure

```text
DocAI/
├── .python-version               # Python version constraint (3.11.9) for Render
├── requirements.txt              # Root build requirements with CPU PyTorch index
├── main.py                       # Root application entrypoint for cloud deployment
├── backend/
│   ├── main.py                   # FastAPI application, routes, and CORS setup
│   ├── chatbot.py                # LLM answer generation (Groq & Ollama)
│   ├── embeddings.py             # SentenceTransformer embeddings & FAISS index
│   ├── pdf_processor.py          # PDF text extraction and overlapping chunking
│   ├── requirements.txt          # Python dependency specifications
│   └── .python-version           # Python 3.11 specification
├── frontend/
│   ├── index.html                # Vite HTML entry point
│   ├── package.json              # React dependencies (Lucide React, Axios, etc.)
│   ├── vite.config.js            # Vite bundler configuration & local proxy
│   └── src/
│       ├── App.jsx               # Main state orchestrator and 3-pane layout
│       ├── App.css               # Pixel-perfect modern SaaS styling
│       ├── components/
│       │   ├── Sidebar.jsx       # Left navigation with history & collapse toggle
│       │   ├── DocumentViewer.jsx# PDF viewer, zoom/page toolbar, & dropzone
│       │   ├── ChatPane.jsx      # Chat messages, reactions, voice input, 3-dots
│       │   ├── ProfileModal.jsx  # User profile edit modal
│       │   └── ApiSettingsModal.jsx # In-app Backend URL & Groq Key settings
│       ├── services/
│       │   ├── api.js            # REST API client with auto-localhost routing
│       │   └── storage.js        # IndexedDB session & binary file persistence
│       └── main.jsx              # React DOM mounting
└── README.md                     # Platform documentation
```

---

## 🚀 Getting Started Locally

### Prerequisites
- **Python 3.10+** (Python 3.11 recommended)
- **Node.js 18+** and **npm**
- *(Optional for offline mode)* **Ollama** installed with `llama3.2:3b` pulled

---

### 1. Clone the Repository
```powershell
git clone https://github.com/Munthalalakshmi-tejaswi/DocAI.git
cd DocAI
```

---

### 2. Set Up & Run the Backend

In a PowerShell terminal:
```powershell
# 1. Create and activate a Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 2. Upgrade pip and install dependencies
python -m pip install --upgrade pip
pip install -r backend/requirements.txt

# 3. Start the FastAPI server on port 8000
python -m uvicorn main:app --reload --app-dir backend --port 8000
```

Verify backend health at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### 3. Set Up & Run the Frontend

In a second PowerShell terminal:
```powershell
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

Open your browser at **`http://localhost:5173`** (or `http://localhost:5174`).

---

### 4. (Optional) Run Local Ollama
If running purely offline without cloud API keys:
```powershell
ollama pull llama3.2:3b
ollama run llama3.2:3b
```

---

## 🌐 100% Free Cloud Deployment Guide

### Deploying the Backend on Render
1. Sign in to [Render.com](https://render.com) with GitHub.
2. Click **New +** > **Web Service**.
3. Select your `DocAI` repository.
4. Set the following configuration:
   - **Language**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
5. Under **Environment Variables**, add:
   - `GROQ_API_KEY`: *(Your free key from [console.groq.com/keys](https://console.groq.com/keys))*
   - `FRONTEND_ORIGINS`: `https://your-frontend.vercel.app,http://localhost:5173`
   - `PYTHON_VERSION`: `3.11.9`
6. Click **Deploy Web Service** and copy your live backend URL (e.g., `https://docai-backend-xxxx.onrender.com`).

---

### Deploying the Frontend on Vercel
1. Sign in to [Vercel.com](https://vercel.com) with GitHub.
2. Click **Add New** > **Project** and import `DocAI`.
3. Set **Root Directory** to `frontend`.
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://docai-backend-xxxx.onrender.com` *(your Render backend URL, without trailing slash)*
5. Click **Deploy**.

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API welcome and status message |
| `GET` | `/health` | Health check and embedding model status |
| `POST` | `/upload` | Upload a PDF (`multipart/form-data`, max 10 MB) and generate FAISS index |
| `POST` | `/chat` | Query the document (`document_id`, `question`, optional `groq_api_key`) |
| `GET` | `/documents/{id}` | Retrieve indexed document metadata (page count, chunk count) |
| `DELETE` | `/documents/{id}` | Unload and clear a document session from server memory |

### Example Chat Request
```json
POST /chat
Content-Type: application/json
X-Groq-Api-Key: gsk_... (optional)

{
  "document_id": "8f3a9e12-4c21-4d3b-9a88-123456789abc",
  "question": "What are the primary safety instructions for device charging?"
}
```

### Example Chat Response
```json
{
  "question": "What are the primary safety instructions for device charging?",
  "answer": "According to the document, only use the official charger and USB Type-C cable to avoid damage. Always unplug the charger after charging is complete, and do not place objects on top of the phone while it charges.",
  "sources": [1]
}
```

---

## ⚙️ Environment Variables

| Variable | Scope | Description | Default |
|---|---|---|---|
| `VITE_API_URL` | Frontend | URL of the live backend API | `http://127.0.0.1:8000` (auto-detected on localhost) |
| `GROQ_API_KEY` | Backend / UI | Free Groq API key for ultra-fast answers | Optional (falls back to local Ollama) |
| `DOC_AI_MODEL` | Backend | LLM model identifier | `llama-3.1-8b-instant` (Groq) / `llama3.2:3b` (Ollama) |
| `FRONTEND_ORIGINS` | Backend | Allowed CORS origins separated by commas | `*` (wildcard permitted) |
| `PYTHON_VERSION` | Cloud (Render) | Python version for pre-built PyTorch wheels | `3.11.9` |

---

## 🛡️ License

This project is licensed under the [MIT License](LICENSE).
Feel free to use, modify, and distribute for personal, educational, or commercial projects.
