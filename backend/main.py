
import os
from uuid import uuid4
from typing import Any

from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


from chatbot import generate_answer
from embeddings import (
    create_vector_database,
    load_embedding_model,
    search_similar_chunks,
)
from pdf_processor import extract_text_from_pdf, split_text_into_chunks


# --------------------------------------------------
# Application configuration
# --------------------------------------------------

APP_TITLE = "DocAI - PDF Question Answering API"

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

app = FastAPI(
    title=APP_TITLE,
    description="Upload PDF documents and ask questions using AI.",
    version="1.0.0",
)


# --------------------------------------------------
# CORS configuration (allows Vercel, localhost, previews)
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?:\/\/.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)



# --------------------------------------------------
# In-memory document storage
# --------------------------------------------------

documents: dict[str, dict[str, Any]] = {}

embedding_model = None


# --------------------------------------------------
# Request model
# --------------------------------------------------

class ChatRequest(BaseModel):
    document_id: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1, max_length=2000)
    groq_api_key: str | None = None



# --------------------------------------------------
# Load embedding model when backend starts
# --------------------------------------------------

@app.on_event("startup")
def load_models():
    global embedding_model

    try:
        print("Loading embedding model...")

        embedding_model = load_embedding_model()

        print("Embedding model loaded successfully.")

    except Exception as exc:
        embedding_model = None
        print(f"Embedding model loading failed: {exc}")


# --------------------------------------------------
# Root API
# --------------------------------------------------

@app.get("/")
def read_root():
    return {
        "message": "Welcome to DocAI API",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
    }


# --------------------------------------------------
# Health check API
# --------------------------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "embedding_model_loaded": embedding_model is not None,
        "documents_in_memory": len(documents),
    }


# --------------------------------------------------
# Upload PDF API
# --------------------------------------------------

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    # Check file name
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Please select a PDF file.",
        )

    # Check PDF extension
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed.",
        )

    try:
        # Read uploaded file
        pdf_bytes = await file.read()

        # Check empty file
        if not pdf_bytes:
            raise HTTPException(
                status_code=400,
                detail="The uploaded PDF is empty.",
            )

        # Check file size
        if len(pdf_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="PDF size must not exceed 10 MB.",
            )

        # Check embedding model
        if embedding_model is None:
            raise HTTPException(
                status_code=503,
                detail="Embedding model is not ready. Please try again.",
            )

        print(f"Processing PDF: {file.filename}")

        # Extract PDF text
        pages = extract_text_from_pdf(pdf_bytes)

        if not pages:
            raise HTTPException(
                status_code=400,
                detail="No readable text found in this PDF.",
            )

        # Split extracted text into chunks
        chunks = split_text_into_chunks(pages)

        if not chunks:
            raise HTTPException(
                status_code=400,
                detail="Could not create text chunks from this PDF.",
            )

        # Create FAISS vector database
        vector_index = create_vector_database(
            chunks,
            embedding_model,
        )

        # Generate unique document ID
        document_id = str(uuid4())

        # Save document information
        documents[document_id] = {
            "filename": file.filename,
            "total_pages": len(pages),
            "chunks": chunks,
            "index": vector_index,
        }

        print(f"PDF uploaded successfully: {file.filename}")

        return {
            "message": "PDF uploaded and processed successfully.",
            "document_id": document_id,
            "filename": file.filename,
            "total_pages": len(pages),
            "total_chunks": len(chunks),
        }

    except HTTPException:
        raise

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        print(f"PDF processing error: {exc}")

        raise HTTPException(
            status_code=500,
            detail=f"PDF processing failed: {str(exc)}",
        ) from exc

    finally:
        await file.close()


# --------------------------------------------------
# Chat API
# --------------------------------------------------

@app.post("/chat")
def chat_with_pdf(
    request: ChatRequest,
    x_groq_api_key: str | None = Header(None, alias="X-Groq-Api-Key"),
):

    question = request.question.strip()

    # Validate question
    if not question:
        raise HTTPException(
            status_code=400,
            detail="Please enter a question.",
        )

    # Check embedding model
    if embedding_model is None:
        raise HTTPException(
            status_code=503,
            detail="Embedding model is not ready.",
        )

    # Find uploaded document
    document = documents.get(request.document_id)

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found. Please upload the PDF again.",
        )

    try:
        print(f"Question received: {question}")

        # Search top 4 most relevant PDF chunks (optimal for accuracy and speed)
        k = min(len(document["chunks"]), 4)
        relevant_chunks = search_similar_chunks(
            question=question,
            index=document["index"],
            chunks=document["chunks"],
            embedding_model=embedding_model,
            top_k=k,
        )

        # Check search results
        if not relevant_chunks:
            return {
                "question": question,
                "answer": (
                    "I could not find relevant information "
                    "in the uploaded document."
                ),
                "sources": [],
            }

        # Generate AI answer (Groq if key provided, or optimized Ollama)
        effective_key = request.groq_api_key or x_groq_api_key
        answer = generate_answer(
            question,
            relevant_chunks,
            groq_api_key=effective_key,
        )


        # Get source page numbers
        source_pages = sorted(
            {
                chunk["page"]
                for chunk in relevant_chunks
            }
        )

        print("Answer generated successfully.")

        return {
            "question": question,
            "answer": answer,
            "sources": source_pages,
        }

    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        print(f"Chat error: {exc}")

        raise HTTPException(
            status_code=500,
            detail=f"Unable to answer the question: {str(exc)}",
        ) from exc


# --------------------------------------------------
# Get document status API
# --------------------------------------------------

@app.get("/documents/{document_id}")
def get_document_info(document_id: str):
    if document_id not in documents:
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )
    doc = documents[document_id]
    return {
        "document_id": document_id,
        "filename": doc["filename"],
        "total_pages": doc["total_pages"],
        "total_chunks": doc["total_chunks"],
    }


# --------------------------------------------------
# Delete document API
# --------------------------------------------------

@app.delete("/documents/{document_id}")
def delete_document(document_id: str):


    # Check document existence
    if document_id not in documents:
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    # Delete document
    del documents[document_id]

    return {
        "message": "Document deleted successfully.",
        "document_id": document_id,
    }


# --------------------------------------------------
# Run application
# --------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
