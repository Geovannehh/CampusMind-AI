import os

import httpx
from fastapi import HTTPException

DIMENSIONS = 1536


def provider_post(path: str, payload: dict):
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise HTTPException(503, "Configure OPENAI_API_KEY na API para ativar o RAG.")
    url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    try:
        with httpx.Client(timeout=90.0) as client:
            response = client.post(
                url + path, headers={"Authorization": "Bearer " + key}, json=payload
            )
            response.raise_for_status()
            return response.json()
    except (httpx.HTTPError, ValueError):
        # Do not expose provider responses, keys or full institutional content.
        raise HTTPException(502, "O provedor de IA não respondeu. Tente novamente.")


def embed(texts: list[str]):
    vectors = []
    for offset in range(0, len(texts), 32):
        data = provider_post(
            "/embeddings",
            {
                "model": os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"),
                "input": texts[offset : offset + 32],
                "dimensions": DIMENSIONS,
            },
        )
        batch = sorted(data.get("data", []), key=lambda x: x["index"])
        if len(batch) != len(texts[offset : offset + 32]) or any(
            len(x["embedding"]) != DIMENSIONS for x in batch
        ):
            raise HTTPException(502, "O modelo retornou embeddings incompatíveis.")
        vectors.extend(x["embedding"] for x in batch)
    return vectors
