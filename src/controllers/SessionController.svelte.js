import { createOpencodeClient } from '@opencode-ai/sdk/client';

export class SessionController {
  client = createOpencodeClient({ baseUrl: '/opencode' });
  
  session = $state(null);
  messages = $state([]);
  error = $state(null);
  sendError = $state(null);
  loading = $state(true);
  isWorking = $state(false);
  workingStatus = $state("");
  streamingParts = $state(new Map());

  // Available options
  modes = $state([]);
  models = $state([]);
  providers = $state([]);

  async fetchOptions() {
    try {
      console.log(`[SessionController::fetchOptions] - Fetching providers, models, and config`);
      
      // Fetch providers and models
      const providerRes = await fetch('/opencode/provider');
      if (providerRes.ok) {
        const data = await providerRes.json();
        const allProviders = data.all || [];
        this.providers = allProviders.map(p => ({ id: p.id, name: p.name }));
        
        let allModels = [];
        allProviders.forEach(p => {
          if (p.models) {
            Object.values(p.models).forEach(m => {
              allModels.push({ id: m.id, name: m.name || m.id, providerId: p.id });
            });
          }
        });
        this.models = allModels;
      }

      // Fetch config for agents/modes
      const agentsRes = await this.client.app.agents();
      if (!agentsRes.error && agentsRes.data) {
        this.modes = agentsRes.data
          .filter(a => !a.hidden)
          .map(a => a.name);
      } else {
        this.modes = [];
      }
    } catch (e) {
      console.error("[SessionController::fetchOptions] - Error fetching options:", e);
      this.modes = [];
    }
  }

  async load(sessionId, isPolling = false) {
    console.log(`[SessionController::load] - started loading session ${sessionId}, isPolling: ${isPolling}`);
    if (!isPolling) this.loading = true;
    this.error = null;

    try {
      // The openapi schema says `session.messages()` exists, but if we get "undefined" or it fails,
      // it might be because the URL is actually `/session/:id/message`. Let's fallback to standard fetch if needed
      // or map appropriately based on the payload format.
      let messagesData = [];
      try {
        console.log(`[SessionController::load] - fetching messages via direct fetch`);
        const messagesRes = await fetch(`/opencode/session/${sessionId}/message`);
        if (messagesRes.ok) {
           messagesData = await messagesRes.json();
           console.log(`[SessionController::load] - fetched ${messagesData.length} messages`);
        } else {
           console.error("[SessionController::load] - Failed to fetch messages:", messagesRes.statusText);
        }
      } catch (e) {
         console.error("[SessionController::load] - Error fetching messages via direct fetch:", e);
      }

      console.log(`[SessionController::load] - calling client.session.get for ${sessionId}`);
      const sessionRes = await this.client.session.get({ path: { id: sessionId } });

      if (sessionRes.error) {
         console.error(`[SessionController::load] - error from client.session.get:`, sessionRes.error);
         this.error = JSON.stringify(sessionRes.error);
         return;
      }

      console.log(`[SessionController::load] - session loaded successfully`);
      this.session = sessionRes.data;
      this.messages = messagesData;
    } catch (err) {
      console.error(`[SessionController::load] - caught exception:`, err);
      this.error = err.message;
    } finally {
      if (!isPolling) this.loading = false;
      console.log(`[SessionController::load] - finished`);
    }
  }

  async sendMessage(sessionId, text, attachments = [], options = {}) {
    console.log(`[SessionController::sendMessage] - started for session ${sessionId}, text: "${text}", attachments: ${attachments.length}`);
    this.sendError = null;
    this.isWorking = true;
    this.workingStatus = "Thinking...";
    this.streamingParts.clear();
    const abortController = new AbortController();

    try {
      const listenToEvents = async () => {
        console.log(`[SessionController::listenToEvents] - starting to subscribe to events`);
        try {
          const res = await this.client.event.subscribe({ signal: abortController.signal });
          console.log(`[SessionController::listenToEvents] - subscribed successfully, reading stream...`);
          for await (const data of res.stream) {
            if (abortController.signal.aborted) {
              console.log(`[SessionController::listenToEvents] - stream aborted, breaking loop`);
              break;
            }

            console.log(`[SessionController::listenToEvents] - event received:`, data);

            // Skip empty/sync pings
            if (data === null || data === undefined || data.type === 'sync') {
              console.log(`[SessionController::listenToEvents] - skipping sync/empty event`);
              continue;
            }

            const eventType = data.type || data.event || 'unknown';

            if (eventType === 'session.error' && data.properties?.error) {
              const err = data.properties.error;
              this.sendError = err.data?.message || err.message || JSON.stringify(err);
            } else if (eventType === 'message.updated' && data.properties?.info?.error) {
              const err = data.properties.info.error;
              this.sendError = err.data?.message || err.message || JSON.stringify(err);
            } else if (eventType === 'message.part.delta') {
              const { partID, field, delta } = data.properties;
              if (field === 'text') {
                const existing = this.streamingParts.get(partID) || { type: 'text', text: '' };
                existing.text = (existing.text || '') + delta;
                
                // Track type from delta event if possible
                if (data.properties.part?.type) {
                  existing.type = data.properties.part.type;
                } else if (!existing.type) {
                  existing.type = 'text'; // Fallback
                }
                
                this.streamingParts.set(partID, existing);
              }
            } else if (eventType === 'message.part.updated') {
              const { part } = data.properties;
              this.streamingParts.set(part.id, part);
            }

            if (typeof data === 'object') {
               // Try to infer status from common patterns and update selectively to prevent flickering
               if (data.properties?.name) this.workingStatus = `Using tool: ${data.properties.name}...`;
               else if (data.properties?.part?.tool) this.workingStatus = `Using tool: ${data.properties.part.tool}...`;
               else if (data.properties?.part?.agent) this.workingStatus = `Delegating to subagent: ${data.properties.part.agent}...`;
               else if (data.properties?.part?.name) this.workingStatus = `Consulting agent: ${data.properties.part.name}...`;
               else if (eventType === 'message.part.delta' && data.properties?.field === 'text') this.workingStatus = 'Typing...';
            }

            console.log(`[SessionController::listenToEvents] - updated status: ${this.workingStatus}`);
          }
          console.log(`[SessionController::listenToEvents] - stream ended`);
        } catch (e) {
          console.error(`[SessionController::listenToEvents] - exception in stream:`, e);
          // Stream aborted or error
        }
      };

      listenToEvents();

      console.log(`[SessionController::sendMessage] - calling client.session.prompt`);
      
      const parts = [];
      if (text) {
        parts.push({ type: "text", text });
      }
      for (const attachment of attachments) {
        parts.push({
          type: "file",
          mime: attachment.type,
          filename: attachment.name,
          url: attachment.url
        });
      }
      
      const body = { parts };
      
      if (options.mode) {
        body.agent = options.mode;
      }
      
      if (options.model && options.provider) {
        body.model = {
          providerID: options.provider,
          modelID: options.model
        };
      }
      
      const res = await this.client.session.prompt({
        path: { id: sessionId },
        body: body
      });

      if (res.error) {
        console.error("[SessionController::sendMessage] - Error sending message:", res.error);
        this.sendError = typeof res.error === 'string' ? res.error : (res.error.message || JSON.stringify(res.error));
        return false;
      }

      console.log(`[SessionController::sendMessage] - prompt successful, calling load()`);
      await this.load(sessionId);
      console.log(`[SessionController::sendMessage] - load completed, returning true`);
      return true;
    } catch (e) {
      console.error("[SessionController::sendMessage] - Exception sending message:", e);
      this.sendError = e.message || "An unexpected error occurred.";
      return false;
    } finally {
      console.log(`[SessionController::sendMessage] - finally block, cleaning up`);
      this.isWorking = false;
      this.workingStatus = "";
      abortController.abort();
    }
  }

  async updateTitle(sessionId, title) {
    console.log(`[SessionController::updateTitle] - updating title for ${sessionId} to "${title}"`);
    try {
      const res = await this.client.session.update({
        path: { id: sessionId },
        body: { title }
      });
      if (res.error) {
        console.error(`[SessionController::updateTitle] - error from client:`, res.error);
        return false;
      }
      if (this.session && this.session.id === sessionId) {
        this.session.title = title;
      }
      return true;
    } catch (e) {
      console.error(`[SessionController::updateTitle] - exception:`, e);
      return false;
    }
  }

  async revert(sessionId, messageId) {
    console.log(`[SessionController::revert] - called with session ${sessionId}, message ${messageId}`);

    // To be implemented
  }
}
