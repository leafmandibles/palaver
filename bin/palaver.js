#!/usr/bin/env node

import { spawn, spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { createOpencodeClient } from "@opencode-ai/sdk/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const args = process.argv.slice(2);
const command = args[0] || "help";

function printHelp() {
  console.log(`
Palaver CLI

Usage: palaver <command>

Commands:
  start      Starts the opencode server on port 5000 and the Palaver web UI, streaming both to the terminal.
  opencode   Shortcut to print and run: opencode attach 0.0.0.0:5000
  chat       Starts a fresh TUI session directly (opencode attach http://localhost:5000)
  status     Listens for events for 5 seconds to collect active conversations, then prints them.
  log        Continuously streams all events from live conversations until Ctrl+C.
  help       Prints this usage summary.
  `);
}

async function startCommand() {
  console.log("Starting opencode serve and Palaver web UI...");
  
  const backend = spawn("opencode", ["serve", "--port", "5000"], { stdio: "inherit" });
  const frontend = spawn("npm", ["run", "preview", "--", "--open"], { cwd: root, stdio: "inherit" });

  const cleanup = () => {
    backend.kill();
    frontend.kill();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

function opencodeCommand() {
  console.log("→ opencode attach 0.0.0.0:5000");
  spawnSync("opencode", ["attach", "0.0.0.0:5000"], { stdio: "inherit" });
}

function chatCommand() {
  spawnSync("opencode", ["attach", "http://localhost:5000"], { stdio: "inherit" });
}

async function statusCommand() {
  console.log("Listening for active conversations for 5 seconds...");
  const client = createOpencodeClient({ baseUrl: "http://localhost:5000" });
  
  const activeSessions = new Set();
  let streamResult;

  try {
    streamResult = await client.global.event();
  } catch (e) {
    console.error("Failed to connect to opencode server. Is it running on port 5000?");
    process.exit(1);
  }

  const timeoutId = setTimeout(async () => {
    try {
      const sessionsRes = await client.session.list();
      const sessions = sessionsRes.data || [];
      
      const sessionMap = new Map();
      for (const s of sessions) {
        sessionMap.set(s.id, s);
      }

      console.log("\nActive Conversations:");
      if (activeSessions.size === 0) {
        console.log("None detected.");
      } else {
        for (const sessionId of activeSessions) {
          const sessionInfo = sessionMap.get(sessionId);
          if (sessionInfo) {
            console.log(`${sessionInfo.directory} - ${sessionInfo.title || "Untitled"}`);
          } else {
            console.log(`Unknown Session ID: ${sessionId}`);
          }
        }
      }
      process.exit(0);
    } catch (e) {
      console.error("Error fetching sessions:", e.message);
      process.exit(1);
    }
  }, 5000);

  try {
    for await (const event of streamResult.stream) {
      if (event && event.payload && event.payload.properties && event.payload.properties.sessionID) {
        activeSessions.add(event.payload.properties.sessionID);
      }
    }
  } catch (e) {
    // Stream closed or error
  }
}

async function logCommand() {
  console.log("Streaming logs from opencode server (Ctrl+C to exit)...");
  const client = createOpencodeClient({ baseUrl: "http://localhost:5000" });
  
  let sessionCache = new Map();
  
  const refreshSessions = async () => {
    try {
      const res = await client.session.list();
      if (res.data) {
        sessionCache.clear();
        for (const s of res.data) {
          sessionCache.set(s.id, s);
        }
      }
    } catch (e) {
      // Ignore errors on background refresh
    }
  };

  await refreshSessions();

  let streamResult;
  try {
    streamResult = await client.global.event();
  } catch (e) {
    console.error("Failed to connect to opencode server. Is it running on port 5000?");
    process.exit(1);
  }

  try {
    for await (const event of streamResult.stream) {
      if (!event || !event.payload) continue;
      
      const payload = event.payload;
      const type = payload.type || "unknown";
      
      let sessionId = null;
      if (payload.properties && payload.properties.sessionID) {
        sessionId = payload.properties.sessionID;
      }
      
      let worktree = event.directory || "?";
      let title = "Unknown";
      
      if (sessionId) {
        let sessionInfo = sessionCache.get(sessionId);
        if (!sessionInfo) {
          await refreshSessions();
          sessionInfo = sessionCache.get(sessionId);
        }
        if (sessionInfo) {
          worktree = sessionInfo.directory || worktree;
          title = sessionInfo.title || "Untitled";
        }
      }
      
      const shortTitle = title.length > 20 ? title.substring(0, 17) + "..." : title;
      
      // event name / type split
      const parts = type.split(".");
      const eventName = parts.length > 1 ? parts.slice(1).join(".") : "";
      const eventCat = parts[0];
      
      console.log(`${worktree} ${shortTitle.padEnd(20)} , ${eventCat} ${eventName}`);
    }
  } catch (e) {
    console.error("Stream closed:", e.message);
  }
}

switch (command) {
  case "start":
    startCommand();
    break;
  case "opencode":
    opencodeCommand();
    break;
  case "chat":
    chatCommand();
    break;
  case "status":
    statusCommand();
    break;
  case "log":
    logCommand();
    break;
  case "help":
  default:
    printHelp();
    break;
}
