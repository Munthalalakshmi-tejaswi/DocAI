import os
import ollama

try:
    from groq import Groq
except ImportError:
    Groq = None


DEFAULT_CHAT_MODEL = "llama3.2:3b"
DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant"


def generate_answer(
    question: str,
    retrieved_chunks: list[dict],
    groq_api_key: str | None = None,
) -> str:
    """
    Generate an answer using only the retrieved PDF text.
    If a Groq API key is provided or present in environment, it uses Groq Cloud (ultra fast < 1s).
    Otherwise, it uses the local Ollama model with optimized multi-threading.
    """
    if not retrieved_chunks:
        return "I could not find relevant information in the uploaded document."

    context_parts = []
    for chunk in retrieved_chunks:
        context_parts.append(
            f"[Page {chunk['page']}]\n{chunk['text']}"
        )

    context = "\n\n".join(context_parts)

    system_prompt = (
        "You are DocAI, an expert AI document assistant that answers questions with 100% accuracy based strictly on the uploaded PDF. "
        "Read the provided document context carefully. Your answer must be factual, thorough, well-structured, and directly supported by the text. "
        "If the document mentions steps, lists, numbers, definitions, or dates, include them clearly. "
        "Cite the relevant page numbers (e.g., [Page 1]) where appropriate. "
        "Do not invent facts or assume information outside the document context. If the document truly does not contain the answer, say so honestly."
    )

    user_prompt = (
        f"DOCUMENT CONTEXT:\n{context}\n\n"
        f"QUESTION:\n{question}\n\n"
        "Provide a comprehensive, accurate answer grounded strictly in the document context above:"
    )

    # Check for Groq API Key (passed from request header/body or environment)
    effective_groq_key = (groq_api_key or os.getenv("GROQ_API_KEY", "")).strip()

    if effective_groq_key and Groq is not None:
        model_name = os.getenv("DOC_AI_MODEL", DEFAULT_GROQ_MODEL)
        try:
            client = Groq(api_key=effective_groq_key)
            completion = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.1,
                max_tokens=500,
            )
            return completion.choices[0].message.content.strip()
        except Exception as exc:
            print(f"Groq API call warning: {exc}, falling back to Ollama...")

    # Default to local Ollama with optimized threads and capped output tokens for speed
    model_name = os.getenv("DOC_AI_MODEL", DEFAULT_CHAT_MODEL)
    try:
        cpu_threads = max(1, (os.cpu_count() or 4) - 1)
        response = ollama.chat(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            options={
                "temperature": 0.1,
                "num_predict": 300,
                "num_thread": cpu_threads,
            },
        )
        return response.message.content.strip()
    except Exception as exc:
        exc_str = str(exc)
        # If running in cloud environment (e.g. Render) without Ollama and without Groq key, provide an extractive grounded response:
        if (
            "Failed to connect to Ollama" in exc_str
            or "ConnectionRefused" in exc_str
            or "ConnectError" in exc_str
            or "111" in exc_str
            or "connect" in exc_str.lower()
        ):
            bullets = []
            for chunk in retrieved_chunks:
                p = chunk.get("page", 1)
                text = chunk.get("text", "").strip()
                clean_snippet = " ".join(text.split())
                bullets.append(f"- **[Page {p}]**: {clean_snippet}")

            return (
                "Here is the relevant information extracted directly from the document:\n\n"
                + "\n\n".join(bullets)
                + "\n\n---\n"
                + "*Tip: For full conversational AI reasoning in under 1 second, add a free Groq API key in the top-right Settings (get one free at https://console.groq.com/keys).*"
            )

        raise RuntimeError(
            f"Could not get a response from AI engine ({model_name}): {exc}. "
            "If using local Ollama, check that it is running. Or add a free Groq API key in Settings for instant answers."
        ) from exc
