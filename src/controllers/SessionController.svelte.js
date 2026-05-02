import { createOpencodeClient } from '@opencode-ai/sdk/client';
import { push } from 'svelte-spa-router';

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

  // Persistent event subscription state
  eventAbortController = null;
  eventGeneration = 0;
  currentEventSessionId = null;

  async fetchOptions() {
    try {
      console.log(`[SessionController::fetchOptions] - Fetching providers, models, and config`);
      
      // Fetch providers and models
      const providerRes = await fetch('/opencode/provider');
      console.log("SessionController:fetchOptions - operation fetch /opencode/provider", providerRes);
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
      console.log("SessionController:fetchOptions - operation client.app.agents", agentsRes);
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

  unsubscribeFromEvents() {
    if (this.eventAbortController) {
      this.eventAbortController.abort();
      this.eventAbortController = null;
    }
    this.eventGeneration++;
    this.currentEventSessionId = null;
  }

  async subscribeToSessionEvents(sessionId) {
    // If already subscribed to this session, do nothing
    if (this.currentEventSessionId === sessionId && this.eventAbortController) {
      return;
    }

    // Unsubscribe from any previous session
    this.unsubscribeFromEvents();

    this.currentEventSessionId = sessionId;
    const abortController = new AbortController();
    this.eventAbortController = abortController;
    const gen = ++this.eventGeneration;

    console.log(`[SessionController::subscribeToSessionEvents] - starting subscription for session ${sessionId}, generation ${gen}`);
    
    try {
      const res = await this.client.event.subscribe({ signal: abortController.signal });
      console.log("SessionController:subscribeToSessionEvents - operation client.event.subscribe", res);
      console.log(`[SessionController::subscribeToSessionEvents] - subscribed successfully for session ${sessionId}, reading stream...`);
      for await (const data of res.stream) {
        if (abortController.signal.aborted) {
          console.log(`[SessionController::subscribeToSessionEvents] - stream aborted, breaking loop`);
          break;
        }
        if (gen !== this.eventGeneration) {
          console.log(`[SessionController::subscribeToSessionEvents] - generation mismatch (${gen} vs ${this.eventGeneration}), breaking loop`);
          break;
        }

        this.processEvent(data, sessionId);
      }
      console.log(`[SessionController::subscribeToSessionEvents] - stream ended for session ${sessionId}`);
    } catch (e) {
      console.error(`[SessionController::subscribeToSessionEvents] - exception in stream for session ${sessionId}:`, e);
    } finally {
      if (this.eventAbortController === abortController) {
        this.eventAbortController = null;
      }
    }
  }

  processEvent(data, sessionId) {
    // Skip empty/sync pings
    if (data === null || data === undefined || data.type === 'sync') {
      return;
    }

    const eventType = data.type || data.event || 'unknown';

    // Filter session-specific events by sessionID
    const eventSessionId = data.properties?.sessionID;
    if (eventSessionId && eventSessionId !== sessionId) {
      return;
    }

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
    } else if (eventType === 'session.idle') {
      console.log(`[SessionController::processEvent] - session idle received for ${sessionId}`);
      this.isWorking = false;
      this.workingStatus = "";
      this.streamingParts.clear();
      this.load(sessionId, true);
      return;
    }

    if (typeof data === 'object') {
       // Try to infer status from common patterns and update selectively to prevent flickering
       if (data.properties?.name) this.workingStatus = `Using tool: ${data.properties.name}...`;
       else if (data.properties?.part?.tool) this.workingStatus = `Using tool: ${data.properties.part.tool}...`;
       else if (data.properties?.part?.agent) this.workingStatus = `Delegating to subagent: ${data.properties.part.agent}...`;
       else if (data.properties?.part?.name) this.workingStatus = `Consulting agent: ${data.properties.part.name}...`;
       else if (eventType === 'message.part.delta' && data.properties?.field === 'text') this.workingStatus = 'Typing...';
    }
  }

  async checkSessionStatus(sessionId) {
    console.log(`[SessionController::checkSessionStatus] - checking status for session ${sessionId}`);
    try {
      const res = await this.client.session.status();
      console.log("SessionController:checkSessionStatus - operation client.session.status", res);
      if (res.error) {
        console.error(`[SessionController::checkSessionStatus] - error:`, res.error);
        return;
      }
      const statuses = res.data || {};
      const status = statuses[sessionId];
      console.log(`[SessionController::checkSessionStatus] - status for ${sessionId}:`, status);
      if (status) {
        if (status.type === 'busy') {
          this.isWorking = true;
          this.workingStatus = 'Working...';
        } else if (status.type === 'retry') {
          this.isWorking = true;
          this.workingStatus = `Retrying... (${status.attempt})`;
        } else if (status.type === 'idle') {
          this.isWorking = false;
          this.workingStatus = '';
          this.streamingParts.clear();
        }
      }
    } catch (e) {
      console.error(`[SessionController::checkSessionStatus] - exception:`, e);
    }
  }

  async load(sessionId, isPolling = false) {
    console.log(`[SessionController::load] - started loading session ${sessionId}, isPolling: ${isPolling}`);
    if (!isPolling) this.loading = true;
    this.error = null;

    try {
      let messagesData = [];
      try {
        console.log(`[SessionController::load] - fetching messages via direct fetch`);
        const messagesRes = await fetch(`/opencode/session/${sessionId}/message`);
        console.log("SessionController:load - operation fetch messages", messagesRes);
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
      console.log("SessionController:load - operation client.session.get", sessionRes);

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

    // Subscribe to events and check ongoing operations after loading
    this.subscribeToSessionEvents(sessionId);
    this.checkSessionStatus(sessionId);
  }

  async sendMessage(sessionId, text, attachments = [], options = {}) {
    console.log(`[SessionController::sendMessage] - started for session ${sessionId}, text: "${text}", attachments: ${attachments.length}`);
    this.sendError = null;
    this.isWorking = true;
    this.workingStatus = "Thinking...";
    this.streamingParts.clear();

    // Ensure we are subscribed to events for this session
    this.subscribeToSessionEvents(sessionId);

    try {
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
      
      // Optimistically add user message so it shows up immediately
      this.messages = [
        ...this.messages,
        {
          id: `temp-${Date.now()}`,
          info: { role: 'user', type: 'UserMessage' },
          parts: JSON.parse(JSON.stringify(parts))
        }
      ];
      
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
      console.log("SessionController:sendMessage - operation client.session.prompt", res);

      if (res.error) {
        console.error("[SessionController::sendMessage] - Error sending message:", res.error);
        this.sendError = typeof res.error === 'string' ? res.error : (res.error.message || JSON.stringify(res.error));
        this.isWorking = false;
        this.workingStatus = "";
        return false;
      }

      console.log(`[SessionController::sendMessage] - prompt successful, calling load()`);
      await this.load(sessionId);
      console.log(`[SessionController::sendMessage] - load completed, returning true`);
      return true;
    } catch (e) {
      console.error("[SessionController::sendMessage] - Exception sending message:", e);
      this.sendError = e.message || "An unexpected error occurred.";
      this.isWorking = false;
      this.workingStatus = "";
      return false;
    }
  }

  async updateTitle(sessionId, title) {
    console.log(`[SessionController::updateTitle] - updating title for ${sessionId} to "${title}"`);
    try {
      const res = await this.client.session.update({
        path: { id: sessionId },
        body: { title }
      });
      console.log("SessionController:updateTitle - operation client.session.update", res);
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

  async forkSession(sessionId, messageId) {
    console.log(`[SessionController::forkSession] - forking session ${sessionId} at message ${messageId}`);
    try {
      const res = await this.client.session.fork({
        path: { id: sessionId },
        body: { messageID: messageId }
      });
      console.log("SessionController:forkSession - operation client.session.fork", res);
      if (res.error) {
        console.error(`[SessionController::forkSession] - error:`, res.error);
        this.error = typeof res.error === 'string' ? res.error : (res.error.message || JSON.stringify(res.error));
        return;
      }
      if (res.data && res.data.id) {
        console.log(`[SessionController::forkSession] - forked to new session ${res.data.id}`);
        push(`/session/${res.data.id}`);
      }
    } catch (err) {
      console.error(`[SessionController::forkSession] - exception:`, err);
      this.error = err.message || 'Failed to fork session.';
    }
  }

  async abortSession(sessionId) {
    console.log(`[SessionController::abortSession] - aborting session ${sessionId}`);
    try {
      const res = await this.client.session.abort({ path: { id: sessionId } });
      console.log("SessionController:abortSession - operation client.session.abort", res);
      if (res.error) {
        console.error(`[SessionController::abortSession] - error:`, res.error);
        this.sendError = typeof res.error === 'string' ? res.error : (res.error.message || JSON.stringify(res.error));
        return false;
      }
      console.log(`[SessionController::abortSession] - aborted successfully`);
      this.isWorking = false;
      this.workingStatus = "";
      this.streamingParts.clear();
      await this.load(sessionId);
      return true;
    } catch (e) {
      console.error(`[SessionController::abortSession] - exception:`, e);
      this.sendError = e.message || 'Failed to abort session.';
      return false;
    }
  }

  async revert(sessionId, messageId) {
    console.log(`[SessionController::revert] - called with session ${sessionId}, message ${messageId}`);

    // To be implemented
  }
}
