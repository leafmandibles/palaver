import { createOpencodeClient } from '@opencode-ai/sdk/client';

const ACTIVE_EVENT_TYPES = new Set([
  'message.updated',
  'message.part.delta',
  'message.part.updated',
  'session.error',
  'session.diff',
  'todo.updated'
]);

export class ProjectEventsController {
  client = createOpencodeClient({ baseUrl: '/opencode' });

  directory = $state(null);
  activeSessionIds = $state(new Set());
  error = $state(null);
  connected = $state(false);

  #eventAbortController = null;
  #reconnectTimer = null;
  #expirationTimers = new Map();

  start(directory) {
    if (!directory) return;
    if (this.directory === directory && this.#eventAbortController) return;

    this.destroy();
    this.directory = directory;
    this.error = null;
    this.#loadCurrentStatuses(directory);
    this.#startEventLoop(directory);
  }

  async #loadCurrentStatuses(directory) {
    try {
      const res = await this.client.session.status({ query: { directory } });
      if (res.error) {
        this.error = JSON.stringify(res.error);
        return;
      }

      for (const [sessionId, status] of Object.entries(res.data || {})) {
        if (status?.type === 'busy' || status?.type === 'retry') {
          this.#markActive(sessionId, false);
        } else if (status?.type === 'idle') {
          this.#markIdle(sessionId);
        }
      }
    } catch (e) {
      this.error = e.message || String(e);
    }
  }

  async #startEventLoop(directory) {
    this.#eventAbortController = new AbortController();
    const signal = this.#eventAbortController.signal;

    try {
      const eventStream = await this.client.event.subscribe({
        query: { directory },
        signal
      });

      this.connected = true;
      this.error = null;

      for await (const event of eventStream.stream) {
        if (signal.aborted) break;

        const payload = event?.type === 'sync' ? event.syncEvent : event;
        if (!payload) continue;

        this.#processEvent(payload);
      }
    } catch (e) {
      if (!signal.aborted) this.error = e.message || String(e);
    } finally {
      this.connected = false;
      if (this.#eventAbortController?.signal === signal) {
        this.#eventAbortController = null;
      }

      if (!signal.aborted) this.#scheduleReconnect(directory);
    }
  }

  #processEvent(payload) {
    const sessionId = payload.properties?.sessionID;
    if (!sessionId) return;

    const eventType = payload.type || payload.event || 'unknown';
    const statusType = payload.properties?.status?.type;

    if (eventType === 'session.idle' || statusType === 'idle') {
      this.#markIdle(sessionId);
      return;
    }

    if (statusType === 'busy' || statusType === 'retry') {
      this.#markActive(sessionId, false);
      return;
    }

    if (ACTIVE_EVENT_TYPES.has(eventType)) {
      this.#markActive(sessionId, true);
    }
  }

  #markActive(sessionId, expires) {
    this.activeSessionIds = new Set([...this.activeSessionIds, sessionId]);

    const existingTimer = this.#expirationTimers.get(sessionId);
    if (existingTimer) clearTimeout(existingTimer);

    if (!expires) {
      this.#expirationTimers.delete(sessionId);
      return;
    }

    const timer = setTimeout(() => {
      this.#expirationTimers.delete(sessionId);
      this.#markIdle(sessionId);
    }, 60000);

    this.#expirationTimers.set(sessionId, timer);
  }

  #markIdle(sessionId) {
    const existingTimer = this.#expirationTimers.get(sessionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.#expirationTimers.delete(sessionId);
    }

    if (!this.activeSessionIds.has(sessionId)) return;

    const nextActiveSessionIds = new Set(this.activeSessionIds);
    nextActiveSessionIds.delete(sessionId);
    this.activeSessionIds = nextActiveSessionIds;
  }

  #scheduleReconnect(directory) {
    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = null;
      if (!this.#eventAbortController) this.#startEventLoop(directory);
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

    for (const timer of this.#expirationTimers.values()) {
      clearTimeout(timer);
    }
    this.#expirationTimers.clear();

    this.connected = false;
    this.directory = null;
    this.activeSessionIds = new Set();
  }
}
