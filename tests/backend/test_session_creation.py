import httpx
from fastapi import FastAPI
from fastapi import Request
from fastapi import Response
from fastapi.testclient import TestClient

from palaver_backend import main as backend_main
from palaver_backend.main import app


def test_session_new_forwards_title_and_directory_to_opencode(monkeypatch):
    """Test that /session/new creates an upstream OpenCode session with title and directory preserved."""
    upstream = FastAPI()

    @upstream.post("/session")
    async def session(request: Request):
        assert request.query_params["directory"] == "/tmp/project"
        assert await request.body() == b'{"title":"New Session"}'

        return {"id": "session-1", "title": "New Session"}

    transport = httpx.ASGITransport(app=upstream)
    async_client = httpx.AsyncClient
    monkeypatch.setattr(
        backend_main.httpx,
        "AsyncClient",
        lambda **kwargs: async_client(transport=transport, base_url=kwargs["base_url"]),
    )

    client = TestClient(app)

    response = client.post(
        "/session/new?directory=/tmp/project",
        content=b'{"title":"New Session"}',
        headers={"content-type": "application/json"},
    )

    assert response.status_code == 200
    assert response.json() == {"id": "session-1", "title": "New Session"}


def test_session_new_returns_upstream_errors_predictably(monkeypatch):
    """Test that /session/new returns upstream OpenCode session creation errors unchanged."""
    upstream = FastAPI()

    @upstream.post("/session")
    async def session():
        return Response(
            content=b'{"error":"invalid directory"}',
            status_code=422,
            media_type="application/json",
        )

    transport = httpx.ASGITransport(app=upstream)
    async_client = httpx.AsyncClient
    monkeypatch.setattr(
        backend_main.httpx,
        "AsyncClient",
        lambda **kwargs: async_client(transport=transport, base_url=kwargs["base_url"]),
    )

    client = TestClient(app)

    response = client.post("/session/new", json={"title": "New Session"})

    assert response.status_code == 422
    assert response.json() == {"error": "invalid directory"}
