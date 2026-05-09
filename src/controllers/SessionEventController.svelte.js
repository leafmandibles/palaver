import { createOpencodeClient } from '@opencode-ai/sdk/client';
import { createId } from '../utils/id.js';

export class SessionEventController {
  client = createOpencodeClient({ baseUrl: '/opencode' });

  sessionId = $state(null);
  directory = $state(null);
  events = $state([]);
  error = $state(null);
  connected = $state(false);

  #eventAbortController = null;
  #reconnectTimer = null;

  constructor(sessionId = null, directory = null) {
    if (sessionId && directory) this.start(sessionId, directory);
  }

  start(sessionId, directory) {
    if (!sessionId || !directory) return;
    if (this.sessionId === sessionId && this.directory === directory && this.#eventAbortController) return;

    this.destroy();
    this.sessionId = sessionId;
    this.directory = directory;
    this.error = null;
    this.#startEventLoop(sessionId, directory);
  }

  async #startEventLoop(sessionId, directory) {
    console.log(`[SessionEventController] Event loop initiated for session ${sessionId}`);
    this.#eventAbortController = new AbortController();
    const signal = this.#eventAbortController.signal;

    try {
      const eventStream = await this.client.event.subscribe({
        query: { directory },
        signal
      });

      this.connected = true;
      this.error = null;
      console.log(`[SessionEventController] Connected to session event stream for ${sessionId}`);

      for await (const event of eventStream.stream) {
        if (signal.aborted) break;

        const actualPayload = event?.type === 'sync' ? event.syncEvent : event;
        if (!actualPayload) continue;
        if (actualPayload.properties?.sessionID !== sessionId) continue;

        this.events = [
          ...this.events,
          {
            id: createId(),
            sessionId,
            type: actualPayload.type || 'unknown',
            timestamp: Date.now(),
            payload: actualPayload
          }
        ];
      }

      console.log(`[SessionEventController] Session event stream ended for ${sessionId}`);
    } catch (e) {
      if (!signal.aborted) {
        this.error = e.message || String(e);
        console.error(`[SessionEventController] Session event stream error for ${sessionId}:`, e);
      } else {
        console.log(`[SessionEventController] Session event stream aborted for ${sessionId}`);
      }
    } finally {
      this.connected = false;
      if (this.#eventAbortController?.signal === signal) {
        this.#eventAbortController = null;
      }

      if (!signal.aborted) {
        this.#scheduleReconnect(sessionId, directory);
      }
    }
  }

  #scheduleReconnect(sessionId, directory) {
    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = null;
      if (!this.#eventAbortController) this.#startEventLoop(sessionId, directory);
    }, 3000);
  }

  destroy() {
    if (this.#reconnectTimer) {
      clearTimeout(this.#reconnectTimer);
      this.#reconnectTimer = null;
    }

    if (this.#eventAbortController) {
      this.#eventAbortController.abort();
      this.#eventAbortController = null;
    }

    this.connected = false;
    this.directory = null;
    this.events = [];
  }
}
