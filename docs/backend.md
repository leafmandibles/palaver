# Palaver Backend

Palaver includes a minimal FastAPI backend boundary for local service integration.

## Start Locally

Install the Python dependencies, then start the backend from the repository root:

```bash
uv sync --dev
uv run uvicorn palaver_backend.main:app --host 127.0.0.1 --port 8000 --reload
```

The default local backend URL is `http://127.0.0.1:8000`.

## Vite OpenCode Proxy

During local frontend development, Vite proxies browser requests from `/opencode` to the FastAPI backend at `http://127.0.0.1:8000` by default. Vite keeps the `/opencode` prefix intact because FastAPI owns that parent route and strips it before forwarding to the real OpenCode upstream.

Configure the backend proxy target with `PALAVER_BACKEND_URL`:

```bash
PALAVER_BACKEND_URL=http://127.0.0.1:8000 npm run dev
```

The Svelte controllers and direct browser fetches continue to call `/opencode`; only Vite's local development target changes.

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

## Local Convex Schema

Palaver's local Convex files live in `convex/`, configured by `convex.json`. The initial schema defines one minimal `events` table with `id`, `source`, and `payload` fields so later work can add event storage without changing the current Svelte behavior yet.

The Svelte app initializes Convex through `src/lib/convexClient.js` and `src/controllers/ConvexController.svelte.js`. By default the browser client targets the self-hosted Convex backend at `http://127.0.0.1:3210`; override that target during local development with `VITE_CONVEX_URL`.

```bash
VITE_CONVEX_URL=http://127.0.0.1:3210 npm run dev
```

The controller exposes a lightweight `verifyConnection()` path that calls the Convex health endpoint, so future UI or diagnostics can confirm the configured local Convex service is reachable without changing the existing `/opencode` frontend contract.

## Vite Convex Proxy

During local frontend development, Vite proxies browser requests from `/convex` to the self-hosted Convex backend at `http://127.0.0.1:3210` by default. The proxy strips the browser-facing `/convex` prefix before forwarding upstream and enables websocket upgrades so Convex sync traffic can use the same route.

Configure the Convex backend proxy target with `PALAVER_CONVEX_BACKEND_URL`:

```bash
PALAVER_CONVEX_BACKEND_URL=http://127.0.0.1:3210 npm run dev
```

The default proxy target matches the local Convex launcher convention from `bin/run_convex.sh`: backend port `3210`, site proxy port `3211`. To verify the proxy manually, start Vite and the local Convex backend, configure the browser client for the Vite route, then check the health endpoint through Vite:

```bash
VITE_CONVEX_URL=http://127.0.0.1:5173/convex npm run dev
curl http://127.0.0.1:5173/convex/api/health
```

Validate the local Convex files with:

```bash
npx convex codegen
```

## Local Convex Launcher

Start the self-hosted Convex backend with:

```bash
bin/run_convex.sh palaver password 3210
```

The optional fourth argument sets the data folder and defaults to `./data` when omitted. The launcher first uses `bin/convex-local-backend`, then falls back to `convex-local-backend` from `PATH` if the project-local binary is unavailable.
