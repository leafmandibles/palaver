import os

from fastapi import FastAPI
from fastapi import Request
from fastapi import Response
import httpx

app = FastAPI(title="Palaver Backend")

HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
}


@app.get("/status")
def status():
    return {"status": "ok"}


@app.api_route("/opencode", methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"])
@app.api_route("/opencode/{path:path}", methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"])
async def opencode_passthrough(request: Request, path: str = ""):
    upstream_url = os.environ.get("OPENCODE_URL", "http://127.0.0.1:5000")
    upstream_path = f"/{path}" if path else "/"
    body = await request.body()
    headers = {
        name: value
        for name, value in request.headers.items()
        if name.lower() not in HOP_BY_HOP_HEADERS and name.lower() != "host"
    }

    async with httpx.AsyncClient(base_url=upstream_url, timeout=None) as client:
        upstream_response = await client.request(
            request.method,
            upstream_path,
            params=request.query_params,
            content=body,
            headers=headers,
        )

    response_headers = {
        name: value
        for name, value in upstream_response.headers.items()
        if name.lower() not in HOP_BY_HOP_HEADERS
    }

    return Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
        headers=response_headers,
    )
