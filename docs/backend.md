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
