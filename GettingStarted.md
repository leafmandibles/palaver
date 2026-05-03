# Getting Started with Palaver

## 1. Start the Opencode server

Start Opencode in server mode on port 4096:

```bash
opencode serve --port 4096
```

## 2. Start Palaver

In the palaver directory, install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Palaver starts on its default Vite port (typically `http://localhost:5173`). Open that in a browser.

## 3. Attach the TUI

In a separate terminal, attach the Opencode TUI to the running server:

```bash
opencode attach http://localhost:4096
```

Now you can run agents in the TUI and watch their output appear live in Palaver, or send follow-up prompts directly from the Palaver UI.
