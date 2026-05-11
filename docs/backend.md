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
| OpenCode upstream for FastAPI | `http://127.0.0.1:5000` | `OPENCODE_URL` |
| Vite `/opencode` proxy target | `http://127.0.0.1:15000` | `PALAVER_BACKEND_URL` |
| Local OpenCode server target for topology decisions | `http://127.0.0.1:5000` | `PALAVER_OPENCODE_SERVER_URL`, then `OPENCODE_URL` |
| Browser Convex client target | `http://127.0.0.1:3210` | `VITE_CONVEX_URL` |
| Vite `/convex` proxy target | `http://127.0.0.1:3210` | `PALAVER_CONVEX_BACKEND_URL` |
| Self-hosted Convex backend | `http://127.0.0.1:3210` when started as shown below | `bin/run_convex.sh <instance_name> <secret> <backend_port> [data_folder]` |
| Self-hosted Convex site proxy | backend port plus one, `http://127.0.0.1:3211` when the backend port is `3210` | Derived by `bin/run_convex.sh` |

The Convex launcher also exports `CONVEX_SELF_HOSTED_URL` and `CONVEX_SELF_HOSTED_ADMIN_KEY` for the `npx convex deploy` process it starts. Contributors normally do not need to set those variables manually.

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

Start OpenCode in server mode before using Palaver's `/opencode` routes. The FastAPI backend defaults to an OpenCode upstream at `http://127.0.0.1:5000`, so the matching local command is:

```bash
opencode serve --port 5000 --hostname 0.0.0.0
```

If you prefer the existing direct OpenCode convention from `GettingStarted.md`, start OpenCode on port `4096` instead and set `OPENCODE_URL` when starting FastAPI:

```bash
opencode serve --port 4096
OPENCODE_URL=http://127.0.0.1:4096 uv run uvicorn palaver_backend.main:app --host 127.0.0.1 --port 15000 --reload
```

Attach the OpenCode TUI to the same server when you want to drive a session from the terminal:

```bash
opencode attach http://127.0.0.1:5000
```

## Vite OpenCode Proxy

During local frontend development, Vite proxies browser requests from `/opencode` to the FastAPI backend at `http://127.0.0.1:15000` by default. The Vite proxy does not rewrite this route: `/opencode/session` reaches FastAPI as `/opencode/session`, and FastAPI strips only the `/opencode` parent prefix before forwarding the request to the real OpenCode upstream.

This FastAPI passthrough is the normal local browser path. Keep the Svelte app and SDK clients pointed at `/opencode` so browser traffic exercises the same FastAPI boundary used for path rewriting, streaming passthrough, and future backend-owned integrations.

Configure the backend proxy target with `PALAVER_BACKEND_URL`:

```bash
PALAVER_BACKEND_URL=http://127.0.0.1:15000 npm run dev
```

The Svelte controllers and direct browser fetches continue to call `/opencode`; only Vite's local development target changes.

There is no direct-to-OpenCode Vite proxy mode in the default configuration. If you need to isolate an OpenCode server while debugging, call that server directly from a terminal or API client, or start FastAPI with `OPENCODE_URL` pointed at the alternate OpenCode server. Do not repoint the browser-facing `/opencode` route at OpenCode directly unless you are intentionally bypassing Palaver's backend passthrough for a temporary local experiment.

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
OPENCODE_URL=http://127.0.0.1:5000 uv run uvicorn palaver_backend.main:app --host 127.0.0.1 --port 15000 --reload
```

If `OPENCODE_URL` is not set, the backend defaults to `http://127.0.0.1:5000`.

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
