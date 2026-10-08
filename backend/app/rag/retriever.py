import os

from sqlalchemy import select

from ..models import Chunk, Document
from .providers import embed


def retrieve(db, question: str, top_k: int = 5):
    vector = embed([question])[0]
    distance = Chunk.embedding.cosine_distance(vector)
    rows = db.execute(
        select(Chunk, Document.title, distance.label("distance"))
        .join(Document, Document.id == Chunk.document_id)
        .order_by(distance)
        .limit(top_k)
    ).all()
    maximum = float(os.getenv("MAX_COSINE_DISTANCE", "0.65"))
    return [
        {
            "document_id": c.document_id,
            "title": title,
            "page": c.page,
            "text": c.text,
            "score": round(1 - float(dist), 4),
        }
        for c, title, dist in rows
        if float(dist) <= maximum
    ]
