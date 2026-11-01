from io import BytesIO
from pypdf import PdfReader


def extract_text_from_pdf(pdf_bytes: bytes) -> list[dict]:
    """
    Read a PDF from memory and return its text page by page.

    Each returned item contains:
      - page: 1-based page number
      - text: extracted text from that page
    """
    try:
        reader = PdfReader(BytesIO(pdf_bytes))
    except Exception as exc:
        raise ValueError("The uploaded file could not be read as a valid PDF.") from exc

    if reader.is_encrypted:
        try:
            unlocked = reader.decrypt("")
            if not unlocked:
                raise ValueError("This PDF is password-protected. Please upload an unlocked PDF.")
        except Exception as exc:
            raise ValueError("This PDF is password-protected. Please upload an unlocked PDF.") from exc

    pages = []
    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        cleaned_text = " ".join(text.split())
        if cleaned_text:
            pages.append({"page": page_number, "text": cleaned_text})

    if not pages:
        raise ValueError(
            "No readable text was found in this PDF. If it is a scanned document, OCR is required."
        )

    return pages


def split_text_into_chunks(
    pages: list[dict],
    chunk_size: int = 800,
    chunk_overlap: int = 120,
) -> list[dict]:
    """
    Split each page's text into smaller overlapping chunks.
    Chunks keep their original page number for source references.
    """
    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than zero.")
    if chunk_overlap < 0 or chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be between zero and chunk_size - 1.")

    chunks = []
    step = chunk_size - chunk_overlap

    for page_data in pages:
        text = page_data["text"]
        page_number = page_data["page"]

        for start in range(0, len(text), step):
            chunk_text = text[start : start + chunk_size].strip()
            if chunk_text:
                chunks.append({
                    "page": page_number,
                    "text": chunk_text,
                })

    return chunks
