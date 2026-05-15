# Palaver Backend

Palaver includes a minimal FastAPI backend boundary for local service integration.

## Start Locally

Install the Python dependencies, then start the backend from the repository root:

```bash
uv sync --dev
uv run uvicorn palaver_backend.main:app --host 127.0.0.1 --port 15000 --reload
```

The default local backend URL is `http://127.0.0.1:15000`.

## Default Ports And Environment Variables

Palaver's local services use these defaults:

| Service | Default | Config |
| --- | --- | --- |
| Vite dev server | `http://127.0.0.1:5173` | Vite's `--host` and `--port` options |
| FastAPI backend | `http://127.0.0.1:15000` | Uvicorn's `--host` and `--port` options |
| OpenCode upstream for FastAPI | `http://127.0.0.1:18000` | `OPENCODE_URL` |
| Vite `/opencode` proxy target | `http://127.0.0.1:15000` | `PALAVER_BACKEND_URL` |
| Local OpenCode server target for topology decisions | `http://127.0.0.1:18000` | `PALAVER_OPENCODE_SERVER_URL`, then `OPENCODE_URL` |
| Browser Convex client target | `http://127.0.0.1:3210` | `VITE_CONVEX_URL` |
| Vite `/convex` proxy target | `http://127.0.0.1:3210` | `PALAVER_CONVEX_BACKEND_URL` |
| Self-hosted Convex backend | `http://127.0.0.1:3210` when started as shown below | `bin/run_convex.sh <instance_name> <secret> <backend_port> [data_folder]` |
| Self-hosted Convex site proxy | backend port plus one, `http://127.0.0.1:3211` when the backend port is `3210` | Derived by `bin/run_convex.sh` |

The Convex launcher also exports `CONVEX_SELF_HOSTED_URL` and `CONVEX_SELF_HOSTED_ADMIN_KEY` for the `npx convex deploy` process it starts. Contributors normally do not need to set those variables manually.

## Honcho Startup With `.env.example`

Use `.env.example` as the copyable starting point for Honcho-based local startup. It defines host, port, and explicit URL values for OpenCode, FastAPI, Convex, and the Palaver UI:

```bash
cp .env.example .env
```

Prefer the full URL variables in `.env.example` over relying on nested variable expansion. Different dotenv consumers do not all expand values like `http://$HOST:$PORT` consistently, so the example repeats explicit URLs for each service boundary.

Honcho loads `.env` automatically from the repository root, and the `Procfile` consumes the same vocabulary for every local process. Start the full local topology with:

```bash
honcho start
```

With the example environment unchanged, Honcho starts OpenCode on `127.0.0.1:18000`, FastAPI on `127.0.0.1:15000`, Convex on `127.0.0.1:3210`, and Vite on `127.0.0.1:5173`. With no `.env` present, the `Procfile` falls back to those same default addresses.

After Honcho starts, verify the FastAPI backend is listening at the configured backend URL:

```bash
curl "${PALAVER_BACKEND_URL:-http://127.0.0.1:15000}/status"
```

It should return:

```json
{"status":"ok"}
```

Then verify Vite can reach the configured OpenCode upstream through the browser-facing `/opencode` route:

```bash
curl -I "http://${PALAVER_WEB_HOST:-127.0.0.1}:${PALAVER_WEB_PORT:-5173}/opencode/session"
```

This request should return an HTTP response from the configured OpenCode path instead of a Vite proxy connection error. A `405 Method Not Allowed` response is acceptable for this header-only smoke check because it confirms the proxy reached an upstream route; `ECONNREFUSED` or an empty response means Vite is targeting a host or port where no matching upstream is listening.

The key URLs are:

| Variable | Purpose |
| --- | --- |
| `OPENCODE_URL` | FastAPI's upstream OpenCode server URL. |
| `PALAVER_OPENCODE_SERVER_URL` | Vite's direct OpenCode target when `palaver.control_plane` is disabled. |
| `PALAVER_BACKEND_URL` | Vite's FastAPI target when `palaver.control_plane` is enabled. |
| `PALAVER_CONVEX_BACKEND_URL` | Vite's local Convex backend proxy target. |
| `VITE_CONVEX_URL` | Browser-exposed Convex client URL. |

The `palaver.control_plane` release flag changes only the `/opencode` target and rewrite behavior. With the flag disabled, Vite targets `PALAVER_OPENCODE_SERVER_URL` and strips `/opencode` before forwarding to OpenCode. With the flag enabled, Vite targets `PALAVER_BACKEND_URL` and preserves `/opencode` so FastAPI owns the passthrough route.

## Local Release Configuration

Local release flags live in `release.config.json`. The file uses GrowthBook-compatible dotted feature names and currently defines `palaver.control_plane` with a deterministic default of `false`, so Palaver starts in thin-client mode. Frontend callers should read that decision through `src/lib/releaseFlags.js` instead of parsing the release configuration directly.

Verify the FastAPI process is accepting requests by checking its health endpoint:

```bash
curl http://127.0.0.1:15000/status
```

It should return:

```json
{"status":"ok"}
```

## Start OpenCode

Start OpenCode in server mode before using Palaver's `/opencode` routes. The FastAPI backend defaults to an OpenCode upstream at `http://127.0.0.1:18000`, so the matching local command is:

```bash
opencode serve --port 18000 --hostname 0.0.0.0
```

If you prefer the existing direct OpenCode convention from `GettingStarted.md`, start OpenCode on port `4096` instead and set `OPENCODE_URL` when starting FastAPI:

```bash
opencode serve --port 4096
OPENCODE_URL=http://127.0.0.1:4096 uv run uvicorn palaver_backend.main:app --host 127.0.0.1 --port 15000 --reload
```

Attach the OpenCode TUI to the same server when you want to drive a session from the terminal:

```bash
opencode attach http://127.0.0.1:18000
```

## Vite OpenCode Proxy

During local frontend development, Vite keeps the browser-facing OpenCode contract at `/opencode`. The proxy target depends on `palaver.control_plane` from `release.config.json`.

With `palaver.control_plane` disabled, Palaver runs as a thin client to `opencode serve`. Vite proxies `/opencode` to the configured OpenCode server target at `http://127.0.0.1:18000` by default and strips only the browser-facing parent prefix before forwarding upstream: `/opencode/session` becomes `/session`, and `/opencode/event` becomes `/event`.

With `palaver.control_plane` enabled, Vite proxies `/opencode` to the FastAPI backend at `http://127.0.0.1:15000` without rewriting. In that mode `/opencode/session` reaches FastAPI as `/opencode/session`, and FastAPI strips only the `/opencode` parent prefix before forwarding the request to the real OpenCode upstream.

Configure the thin-client OpenCode target with `PALAVER_OPENCODE_SERVER_URL`, or `OPENCODE_URL` as a fallback:

```bash
PALAVER_OPENCODE_SERVER_URL=http://127.0.0.1:18000 npm run dev
```

Configure the control-plane backend proxy target with `PALAVER_BACKEND_URL`:

```bash
PALAVER_BACKEND_URL=http://127.0.0.1:15000 npm run dev
```

The Svelte controllers and direct browser fetches continue to call `/opencode`; only Vite's local development target and rewrite behavior change with the release topology.

## Local Startup Modes

Palaver has two local OpenCode-backed startup modes. In both modes, browser-facing OpenCode calls stay on `/opencode`; the difference is whether Vite forwards those calls directly to `opencode serve` or through the FastAPI control plane.

### Thin-Client Mode

Thin-client mode is the default because `release.config.json` defines `palaver.control_plane` as `false`. Start OpenCode on the default local server port, then start Vite:

```bash
opencode serve --port 18000 --hostname 0.0.0.0
PALAVER_OPENCODE_SERVER_URL=http://127.0.0.1:18000 npm run dev
```

If `PALAVER_OPENCODE_SERVER_URL` is omitted, Vite falls back to `OPENCODE_URL`, then `http://127.0.0.1:18000`. In this mode Vite proxies `/opencode` to OpenCode and strips only the parent prefix, so `/opencode/session` is forwarded upstream as `/session`.

### FastAPI Control-Plane Mode

Enable `palaver.control_plane` in `release.config.json` when you want Palaver-owned commands to go through FastAPI. Start OpenCode, start FastAPI on its default local port, then start Vite with the backend target:

```bash
opencode serve --port 18000 --hostname 0.0.0.0
OPENCODE_URL=http://127.0.0.1:18000 uv run uvicorn palaver_backend.main:app --host 127.0.0.1 --port 15000 --reload
PALAVER_BACKEND_URL=http://127.0.0.1:15000 npm run dev
```

If `PALAVER_BACKEND_URL` is omitted, Vite targets `http://127.0.0.1:15000`. In this mode Vite preserves `/opencode`, so `/opencode/session` reaches FastAPI unchanged; FastAPI then strips `/opencode` before forwarding to the configured OpenCode upstream.

`POST /session/new` is separate from `/opencode/*` because it is a Palaver control-plane command, not an OpenCode-compatible passthrough route. The endpoint creates an upstream OpenCode session through `OPENCODE_URL` while keeping Palaver-owned behavior outside the passthrough namespace.

## Health Check

Verify the backend is running with:

```bash
curl http://127.0.0.1:15000/status
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
OPENCODE_URL=http://127.0.0.1:18000 uv run uvicorn palaver_backend.main:app --host 127.0.0.1 --port 15000 --reload
```

If `OPENCODE_URL` is not set, the backend defaults to `http://127.0.0.1:18000`.

## Control-Plane Session Creation

When `palaver.control_plane` is enabled, Palaver-owned commands stay outside the OpenCode passthrough route. `POST /session/new` creates an upstream OpenCode session by forwarding to `POST /session` on the configured `OPENCODE_URL`, preserving the JSON request body and query parameters such as `directory`.

Example:

```bash
curl -X POST 'http://127.0.0.1:15000/session/new?directory=/path/to/project' \
  -H 'content-type: application/json' \
  --data '{"title":"New Session"}'
```

Successful responses and upstream OpenCode errors are returned with the upstream status code and response body so callers can handle session creation predictably.

To manually verify incremental stream delivery, start the backend with `OPENCODE_URL` pointed at a streaming OpenCode-compatible upstream, then run:

```bash
curl -N http://127.0.0.1:15000/opencode/event
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

Start the self-hosted Convex backend through Palaver's launcher from the repository root:

```bash
bin/run_convex.sh palaver password 3210
```

The arguments are `<instance_name> <secret> <backend_port> [data_folder]`. The optional `data_folder` defaults to `./data`; with the command above, Convex stores state under `./data/palaver`, listens on backend port `3210`, and exposes the Convex site proxy on `3211`.

The launcher starts `bin/convex-local-backend` first and falls back to `convex-local-backend` from `PATH` if the project-local binary is unavailable. After the backend starts, it derives and exports `CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210` and `CONVEX_SELF_HOSTED_ADMIN_KEY`, then runs `npx convex deploy` so the local schema in `convex/` is deployed to the self-hosted instance.

Keep the launcher process running while using the app. In another shell, start Vite with the browser client pointed at the Vite Convex proxy when you want frontend traffic to flow through `/convex`:

```bash
VITE_CONVEX_URL=http://127.0.0.1:5173/convex npm run dev
```
