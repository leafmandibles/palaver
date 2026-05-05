import { createOpencodeClient } from '@opencode-ai/sdk/client';

export class GlobalEvents {
  client = createOpencodeClient({ baseUrl: '/opencode' });
  
  events = $state([]);
  #expirationTimers = new Set();
  #eventAbortController = null;

  constructor() {
    this.#startEventLoop();
  }

  async #startEventLoop() {
    console.log("[GlobalEvents] _startEventLoop initiated");
    this.#eventAbortController = new AbortController();
    const signal = this.#eventAbortController.signal;

    try {
      const globalEventsStream = await this.client.global.event({ signal });
      console.log("[GlobalEvents] Connected to global event stream successfully");
      
      for await (const event of globalEventsStream.stream) {
        if (signal.aborted) {
          console.log("[GlobalEvents] Signal aborted, breaking event loop");
          break;
        }
        console.log(`[GlobalEvents] Detected event: `, event);
        const { project, payload } = event;
        if (!project || !payload) continue;

        const actualPayload = payload.type === 'sync' ? payload.syncEvent : payload;
        if (!actualPayload) continue;

        if (
          actualPayload.type?.startsWith('message.updated') || 
          actualPayload.type?.startsWith('message.part.delta') || 
          actualPayload.type?.startsWith('message.part.updated') ||
          (actualPayload.type === 'session.status' && actualPayload.properties?.status?.type === 'busy')
        ) {
          console.log(`[GlobalEvents] Detected active event for project ${project}:`, actualPayload.type);
          
          const record = { id: crypto.randomUUID(), project, type: actualPayload.type, timestamp: Date.now(), payload: actualPayload };
          
          // Append to array immutably to guarantee Svelte 5 reactivity
          this.events = [...this.events, record];

          // Expire after 60s
          const timerId = setTimeout(() => {
            this.events = this.events.filter(e => e !== record);
            this.#expirationTimers.delete(timerId);
          }, 60000);
          this.#expirationTimers.add(timerId);
        }
      }
      console.log("[GlobalEvents] Global event stream ended cleanly");
    } catch (e) {
      if (!signal.aborted) {
        console.error("[GlobalEvents] Global event stream error:", e);
        console.log("[GlobalEvents] Attempting reconnect in 3s...");
        setTimeout(() => {
          if (!signal.aborted) this.#startEventLoop();
        }, 3000);
      } else {
        console.log("[GlobalEvents] Global event stream aborted intentionally");
      }
    }
  }

  destroy() {
    if (this.#eventAbortController) {
      this.#eventAbortController.abort();
      this.#eventAbortController = null;
    }
    for (const timer of this.#expirationTimers) {
      clearTimeout(timer);
    }
    this.#expirationTimers.clear();
    this.events = [];
  }
}
