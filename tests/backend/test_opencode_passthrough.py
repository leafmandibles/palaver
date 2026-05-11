import asyncio

import httpx
from fastapi import FastAPI
from fastapi import Request
from fastapi import Response
from fastapi.testclient import TestClient
from starlette.responses import StreamingResponse

from palaver_backend.main import app
from palaver_backend import main as backend_main


def test_opencode_passthrough_preserves_request_and_response(monkeypatch):
    """Test that /opencode forwards the rewritten path, method, query, body, status, and body."""
    upstream = FastAPI()

    @upstream.api_route("/session/{session_id}", methods=["PATCH"])
    async def session(session_id: str, request: Request):
        assert session_id == "abc123"
        assert request.url.query == "include=messages&limit=1"
        assert await request.body() == b'{"text":"hello"}'

        return Response(
            content=b'{"proxied":true}',
            status_code=207,
            media_type="application/json",
        )

    monkeypatch.setenv("OPENCODE_URL", "http://opencode.test")
    transport = httpx.ASGITransport(app=upstream)
    async_client = httpx.AsyncClient
    monkeypatch.setattr(
        backend_main.httpx,
        "AsyncClient",
        lambda **kwargs: async_client(transport=transport, base_url=kwargs["base_url"]),
    )

    client = TestClient(app)

    response = client.patch(
        "/opencode/session/abc123?include=messages&limit=1",
        content=b'{"text":"hello"}',
        headers={"content-type": "application/json"},
    )

    assert response.status_code == 207
    assert response.json() == {"proxied": True}


def test_opencode_passthrough_does_not_forward_hop_by_hop_headers(monkeypatch):
    """Test that hop-by-hop headers are stripped before forwarding to the OpenCode upstream."""
    upstream = FastAPI()

    @upstream.get("/headers")
    async def headers(request: Request):
        return {
            "keep_alive": request.headers.get("keep-alive"),
            "te": request.headers.get("te"),
            "x_request_id": request.headers.get("x-request-id"),
        }

    transport = httpx.ASGITransport(app=upstream)
    async_client = httpx.AsyncClient
    monkeypatch.setattr(
        backend_main.httpx,
        "AsyncClient",
        lambda **kwargs: async_client(transport=transport, base_url=kwargs["base_url"]),
    )

    client = TestClient(app)

    response = client.get(
        "/opencode/headers",
        headers={
            "connection": "close",
            "keep-alive": "timeout=5",
            "te": "trailers",
            "x-request-id": "request-1",
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "keep_alive": None,
        "te": None,
        "x_request_id": "request-1",
    }


def test_opencode_passthrough_forwards_streaming_response(monkeypatch):
    """Test that streamed OpenCode response chunks are forwarded by the passthrough route."""
    upstream = FastAPI()

    @upstream.get("/events")
    async def events():
        async def body():
            yield b"event: start\n\n"
            await asyncio.sleep(0)
            yield b"event: end\n\n"

        return StreamingResponse(body(), media_type="text/event-stream", status_code=206)

    transport = httpx.ASGITransport(app=upstream)
    async_client = httpx.AsyncClient
    monkeypatch.setattr(
        backend_main.httpx,
        "AsyncClient",
        lambda **kwargs: async_client(transport=transport, base_url=kwargs["base_url"]),
    )

    client = TestClient(app)

    with client.stream("GET", "/opencode/events") as response:
        assert response.status_code == 206
        assert response.headers["content-type"].startswith("text/event-stream")
        assert b"".join(response.iter_bytes()) == b"event: start\n\nevent: end\n\n"
