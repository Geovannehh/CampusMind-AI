import pymupdf
from fastapi import HTTPException

from .chunking import chunk_pages
from .providers import embed


def extract(raw: bytes, filename: str):
    if filename.lower().endswith(".pdf"):
        try:
            with pymupdf.open(stream=raw, filetype="pdf") as pdf:
                if pdf.needs_pass:
                    raise HTTPException(422, "PDF protegido por senha.")
                if len(pdf) > 300:
                    raise HTTPException(422, "Use um PDF de até 300 páginas.")
                pages = [page.get_text(sort=True) for page in pdf]
            mime = "application/pdf"
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(422, "Não foi possível ler o PDF.")
    elif filename.lower().endswith(".txt"):
        try:
            pages = [raw.decode("utf-8-sig")]
        except UnicodeError:
            raise HTTPException(422, "Use um TXT codificado em UTF-8.")
        mime = "text/plain"
    else:
        raise HTTPException(415, "Envie um arquivo PDF ou TXT.")
    chunks = chunk_pages(pages)
    if not chunks:
        raise HTTPException(
            422, "Nenhum texto extraído. PDFs digitalizados precisam de OCR, ainda não disponível."
        )
    if len(chunks) > 2000:
        raise HTTPException(422, "O documento excede o limite de 2.000 trechos.")
    return pages, chunks, mime


def prepare(raw: bytes, filename: str):
    pages, chunks, mime = extract(raw, filename)
    vectors = embed([c["text"] for c in chunks])
    return pages, chunks, mime, vectors
