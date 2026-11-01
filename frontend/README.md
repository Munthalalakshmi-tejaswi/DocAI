# DocAI – PDF Question Answering Chatbot

A beginner-friendly Retrieval-Augmented Generation (RAG) application. Upload a PDF, ask questions about it, and receive answers grounded in the document.

## Technology

- Frontend: React, Vite, Axios, Lucide React
- Backend: Python, FastAPI, pypdf
- Embeddings: sentence-transformers (`all-MiniLM-L6-v2`)
- Vector search: FAISS
- Local LLM: Ollama (`llama3.2:3b`)

## Project structure

```text
DocAI/
├── backend/
│   ├── __init__.py
│   ├── main.py
│   ├── pdf_processor.py
│   ├── embeddings.py
│   ├── chatbot.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── components/
│       │   ├── FileUpload.jsx
│       │   ├── ChatWindow.jsx
│       │   └── Message.jsx
│       ├── services/
│       │   └── api.js
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
├── .gitignore
└── README.md
```

## Requirements

- Python 3.10 or newer (Python 3.11 recommended)
- Node.js and npm
- Ollama installed locally
- At least one Ollama model pulled, such as `llama3.2:3b`

## 1. Set up the backend

Open PowerShell in the DocAI root folder:

```powershell
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
```

If PowerShell blocks virtual-environment activation, run this for the current terminal only:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

## 2. Set up Ollama

Install Ollama from https://ollama.com/download and open/run it.

In a separate terminal:

```powershell
ollama pull llama3.2:3b
ollama run llama3.2:3b
```

Wait for the model prompt. You can type `/bye` to leave the interactive chat. Keep the Ollama application/service running while using DocAI.

The Python `ollama` package is a client; it does not install the Ollama application or the model.

## 3. Start the backend

From the DocAI root folder, with `venv` activated:

```powershell
python -m uvicorn main:app --reload --app-dir backend --port 8000
```

Backend:
- API root: http://127.0.0.1:8000/
- Health check: http://127.0.0.1:8000/health
- Swagger documentation: http://127.0.0.1:8000/docs

The first run downloads the public sentence-transformer model. This can take a few minutes.

## 4. Set up and start the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally http://localhost:5173.

## 5. Use the application

1. Select a PDF file (up to 10 MB).
2. Select **Upload and Process** and wait for processing to finish.
3. Ask a question about the uploaded document.
4. Read the answer and the source page numbers.
5. Select **New PDF** to start another document session.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | API welcome message |
| GET | `/health` | Backend and loaded-model status |
| POST | `/upload` | Upload and index a PDF |
| POST | `/chat` | Ask a question about an uploaded PDF |
| DELETE | `/documents/{document_id}` | Delete a document from memory |

### Upload

`POST /upload` uses `multipart/form-data` with the field name `file`.

Example response:

```json
{
  "message": "PDF uploaded and processed successfully.",
  "document_id": "generated-id",
  "filename": "example.pdf",
  "total_pages": 5,
  "total_chunks": 12
}
```

### Chat

`POST /chat` JSON body:

```json
{
  "document_id": "generated-id",
  "question": "What is this document about?"
}
```

Example response:

```json
{
  "question": "What is this document about?",
  "answer": "The document describes ...",
  "sources": [1, 2]
}
```

## Notes and limitations

- Uploaded documents and FAISS indexes are stored in application memory. They are cleared when the backend restarts.
- This starter project processes one active PDF per browser session. It is intended for local learning and development, not production deployment.
- Scanned PDFs that contain only images need OCR. This version extracts selectable text and does not include OCR.
- The LLM is instructed to say when the answer is not available in the supplied document. However, generated answers can still be inaccurate; verify important information.
- Do not upload confidential or sensitive documents to an untrusted environment.
