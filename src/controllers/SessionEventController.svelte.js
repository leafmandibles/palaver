export class SessionEventController {
  sessionId = $state(null);
  events = $state([]);
  error = $state(null);
  connected = $state(false);

  #eventAbortController = null;
  #reconnectTimer = null;

  constructor(sessionId = null) {
    if (sessionId) this.start(sessionId);
  }

  start(sessionId) {
    if (!sessionId) return;
    if (this.sessionId === sessionId && this.#eventAbortController) return;

    this.destroy();
    this.sessionId = sessionId;
    this.error = null;
    this.#startEventLoop(sessionId);
  }

  async #startEventLoop(sessionId) {
    console.log(`[SessionEventController] Event loop initiated for session ${sessionId}`);
    this.#eventAbortController = new AbortController();
    const signal = this.#eventAbortController.signal;

    try {
      const response = await fetch(`/opencode/session/${encodeURIComponent(sessionId)}/event`, {
        headers: { Accept: 'text/event-stream' },
        signal
      });

      if (!response.ok) {
        throw new Error(`Session event stream failed: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Session event stream response had no body');
      }

      this.connected = true;
      this.error = null;
      console.log(`[SessionEventController] Connected to session event stream for ${sessionId}`);

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';

      try {
        while (!signal.aborted) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += value;
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() ?? '';

          for (const chunk of chunks) {
            const event = this.#parseSseChunk(chunk);
            if (!event) continue;

            const actualPayload = event.type === 'sync' ? event.syncEvent : event;
            if (!actualPayload) continue;

            this.events = [
              ...this.events,
              {
                id: crypto.randomUUID(),
                sessionId,
                type: actualPayload.type || 'unknown',
                timestamp: Date.now(),
                payload: actualPayload
              }
            ];
          }
        }
      } finally {
        reader.releaseLock();
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
        this.#scheduleReconnect(sessionId);
      }
    }
  }

  #parseSseChunk(chunk) {
    const data = chunk
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.replace(/^data:\s*/, ''))
      .join('\n');

    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch (e) {
      console.warn('[SessionEventController] Ignoring non-JSON session event:', data);
      return null;
    }
  }

  #scheduleReconnect(sessionId) {
    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = null;
      if (!this.#eventAbortController) this.#startEventLoop(sessionId);
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
    this.events = [];
  }
}
