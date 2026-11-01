import gc
import faiss
import numpy as np
import torch
from sentence_transformers import SentenceTransformer

# Limit PyTorch CPU threads to avoid memory / CPU spikes on Render free tier
try:
    torch.set_num_threads(1)
except Exception:
    pass

EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def load_embedding_model() -> SentenceTransformer:
    """Load the sentence-transformer model used for both documents and questions."""
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    model.eval()
    return model


def create_vector_database(
    chunks: list[dict],
    embedding_model: SentenceTransformer,
):
    """
    Convert document chunks into embeddings and create a FAISS index.
    Embeddings are normalized so inner-product search works like cosine similarity.
    """
    if not chunks:
        raise ValueError("There is no text available to create a search index.")

    texts = [chunk["text"] for chunk in chunks]
    with torch.no_grad():
        vectors = embedding_model.encode(
            texts,
            batch_size=8,
            convert_to_numpy=True,
            show_progress_bar=False,
        )

    vectors = np.asarray(vectors, dtype="float32")
    faiss.normalize_L2(vectors)

    index = faiss.IndexFlatIP(vectors.shape[1])
    index.add(vectors)
    gc.collect()

    return index


def search_similar_chunks(
    question: str,
    index,
    chunks: list[dict],
    embedding_model: SentenceTransformer,
    top_k: int = 4,
) -> list[dict]:
    """Find the most relevant text chunks for a user's question."""
    if not question.strip() or index.ntotal == 0:
        return []

    with torch.no_grad():
        question_vector = embedding_model.encode(
            [question],
            batch_size=1,
            convert_to_numpy=True,
            show_progress_bar=False,
        )
    question_vector = np.asarray(question_vector, dtype="float32")
    faiss.normalize_L2(question_vector)

    number_to_search = min(top_k, index.ntotal)
    scores, indices = index.search(question_vector, number_to_search)

    results = []
    for score, chunk_index in zip(scores[0], indices[0]):
        if chunk_index < 0:
            continue

        result = dict(chunks[int(chunk_index)])
        result["score"] = float(score)
        results.append(result)

    return results
