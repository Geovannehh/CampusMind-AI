"""Page-aware character chunks. No invented page numbers or silent truncation."""


def chunk_pages(pages: list[str], size: int = 1000, overlap: int = 180):
    if not 0 <= overlap < size:
        raise ValueError("overlap must be smaller than size")
    chunks = []
    for number, content in enumerate(pages, start=1):
        text = "\n".join(line.strip() for line in content.splitlines()).strip()
        start = 0
        while start < len(text):
            end = min(start + size, len(text))
            # End at a word boundary while retaining a useful minimum length.
            boundary = text.rfind(" ", start + size // 2, end)
            if end < len(text) and boundary != -1:
                end = boundary
            piece = text[start:end].strip()
            if piece:
                chunks.append({"page": number, "text": piece, "index": len(chunks)})
            if end == len(text):
                break
            start = end - overlap
    return chunks
