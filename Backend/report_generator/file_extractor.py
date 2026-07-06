"""
file_extractor.py
~~~~~~~~~~~~~~~~~
Extracts plain text from uploaded .txt or .docx files.
"""

import io
import logging

logger = logging.getLogger(__name__)


def extract_text_from_file(uploaded_file) -> str:
    """
    Extract text from a Django InMemoryUploadedFile or TemporaryUploadedFile.

    Supported types
    ---------------
    .txt  – decoded as UTF-8 (falls back to latin-1)
    .docx – extracted via python-docx

    Returns
    -------
    str  Plain text content of the file.

    Raises
    ------
    ValueError  If the file type is not supported or text cannot be extracted.
    """
    filename: str = uploaded_file.name.lower()

    if filename.endswith(".txt"):
        raw_bytes = uploaded_file.read()
        try:
            return raw_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return raw_bytes.decode("latin-1")

    if filename.endswith(".docx"):
        try:
            from docx import Document as DocxDocument
            file_bytes = io.BytesIO(uploaded_file.read())
            doc = DocxDocument(file_bytes)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n\n".join(paragraphs)
        except Exception as exc:
            logger.error("Failed to read .docx file: %s", exc)
            raise ValueError(f"Could not parse the uploaded .docx file: {exc}") from exc

    raise ValueError(
        f"Unsupported file type '{uploaded_file.name}'. "
        "Please upload a .txt or .docx file."
    )
