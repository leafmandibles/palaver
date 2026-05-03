# Palaver

Palaver is a small Svelte 5 frontend for browsing and continuing local Opencode work.

It connects to a local Opencode server, shows available projects and sessions, streams live session activity, and lets you keep chatting inside an existing session.

## What It Does

- Lists Opencode projects, grouped by recent activity
- Shows sessions for a selected project
- Creates a new session inside a project
- Opens a full session transcript
- Renders user messages, assistant messages, tool calls, reasoning, agents, and file parts
- Streams live updates while a session is running
- Lets you send follow-up prompts from the UI
- Supports pasted image attachments
- Lets you switch mode, provider, and model before sending
- Includes a live events view for recent global Opencode activity

## Requirements

- Node.js
- A local Opencode server running on `http://127.0.0.1:4096`

During development, Vite proxies requests from `/opencode` to the local Opencode server.

## Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Routes

- `/` - project list
- `/project/:project_id/sessions` - sessions for a project
- `/session/:session_id` - session transcript and chat UI
- `/events` - live global event stream

## Tech Stack

- Svelte 5
- Vite
- `svelte-spa-router`
- `@opencode-ai/sdk`

## Project Structure

- `src/App.svelte` - app entry point and route wiring
- `src/ProjectList.svelte` - project list screen
- `src/SessionHistory.svelte` - sessions for one project
- `src/Session.svelte` - session viewer and chat interface
- `src/Events.svelte` - live event monitor
- `src/controllers/` - Opencode API and event-stream logic
- `src/components/` - message, input, selector, and part-rendering UI

## Notes

This is a client-side SPA built with Svelte and Vite, not SvelteKit.
