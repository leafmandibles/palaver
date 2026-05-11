# Palaver Backend

Palaver includes a minimal FastAPI backend boundary for local service integration.

## Start Locally

Install the Python dependencies, then start the backend from the repository root:

```bash
uv sync --dev
uv run uvicorn palaver_backend.main:app --host 127.0.0.1 --port 8000 --reload
```

The default local backend URL is `http://127.0.0.1:8000`.

## Health Check

Verify the backend is running with:

```bash
curl http://127.0.0.1:8000/status
```

The endpoint returns:

```json
{"status":"ok"}
```

## OpenCode HTTP Passthrough

The backend owns the `/opencode` parent prefix and forwards HTTP requests to the configured OpenCode upstream after stripping that parent prefix. For example, `POST /opencode/session` is forwarded upstream as `POST /session` with the original query string and request body.

Streaming OpenCode responses are forwarded with FastAPI streaming responses instead of being read fully into memory first. This keeps event and session streams consumable through the same `/opencode` client URL used by the Svelte controllers.

Palaver's current OpenCode integration does not require websocket passthrough. The Svelte controllers and CLI helpers connect through the OpenCode SDK's HTTP streaming APIs, and the remaining direct calls are ordinary `/opencode/...` HTTP fetches. Because no current client code opens websocket upgrades under `/opencode`, the backend intentionally keeps the passthrough HTTP and streaming-response based instead of adding an unused websocket proxy.

Configure the upstream with `OPENCODE_URL`:

```bash
OPENCODE_URL=http://127.0.0.1:5000 uv run uvicorn palaver_backend.main:app --host 127.0.0.1 --port 8000 --reload
```

If `OPENCODE_URL` is not set, the backend defaults to `http://127.0.0.1:5000`.

To manually verify incremental stream delivery, start the backend with `OPENCODE_URL` pointed at a streaming OpenCode-compatible upstream, then run:

```bash
curl -N http://127.0.0.1:8000/opencode/event
```

Events should appear as they are emitted by the upstream, not only after the upstream closes the response.
