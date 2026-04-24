import { createOpencodeClient } from '@opencode-ai/sdk/client';

export class SessionController {
  client = createOpencodeClient({ baseUrl: 'http://127.0.0.1:4096' });
  
  session = $state(null);
  messages = $state([]);
  error = $state(null);
  loading = $state(true);
  isWorking = $state(false);
  workingStatus = $state("");

  async load(sessionId, isPolling = false) {
    if (!isPolling) this.loading = true;
    this.error = null;

    try {
      // The openapi schema says `session.messages()` exists, but if we get "undefined" or it fails,
      // it might be because the URL is actually `/session/:id/message`. Let's fallback to standard fetch if needed
      // or map appropriately based on the payload format.
      let messagesData = [];
      try {
        const messagesRes = await fetch(`http://127.0.0.1:4096/session/${sessionId}/message`);
        if (messagesRes.ok) {
           messagesData = await messagesRes.json();
        } else {
           console.error("Failed to fetch messages:", messagesRes.statusText);
        }
      } catch (e) {
         console.error("Error fetching messages via direct fetch:", e);
      }

      const sessionRes = await this.client.session.get({ path: { id: sessionId } });

      if (sessionRes.error) {
         this.error = JSON.stringify(sessionRes.error);
         return;
      }

      this.session = sessionRes.data;
      this.messages = messagesData;
    } catch (err) {
      this.error = err.message;
    } finally {
      if (!isPolling) this.loading = false;
    }
  }

  async sendMessage(sessionId, text) {
    this.isWorking = true;
    this.workingStatus = "Thinking...";
    const abortController = new AbortController();

    try {
      const listenToEvents = async () => {
        try {
          const res = await this.client.event.subscribe({ signal: abortController.signal });
          for await (const data of res.stream) {
            if (abortController.signal.aborted) break;
            const payload = data.payload;
            
            if (payload?.type === 'command.executed') {
              this.workingStatus = `Using tool: ${payload.properties.name}...`;
            } else if (payload?.type === 'message.part.updated') {
              const part = payload.properties.part;
              if (part.type === 'tool') {
                if (part.state?.type === 'running' || part.state?.type === 'pending') {
                  this.workingStatus = `Using tool: ${part.tool}...`;
                } else if (part.state?.type === 'completed') {
                  this.workingStatus = "Thinking...";
                }
              } else if (part.type === 'subtask') {
                this.workingStatus = `Delegating to subagent: ${part.agent}...`;
              } else if (part.type === 'agent') {
                this.workingStatus = `Consulting agent: ${part.name}...`;
              }
            } else if (payload?.type === 'session.status') {
              if (payload.properties.status.type === 'busy') {
                if (this.workingStatus === "Organizing tasks...") {
                  this.workingStatus = "Thinking...";
                }
              }
            } else if (payload?.type === 'todo.updated') {
               this.workingStatus = "Organizing tasks...";
            }
          }
        } catch (e) {
          // Stream aborted or error
        }
      };

      listenToEvents();

      const res = await this.client.session.prompt({
        path: { id: sessionId },
        body: {
          parts: [{ type: "text", text }]
        }
      });

      if (res.error) {
        console.error("Error sending message:", res.error);
        return false;
      }

      await this.load(sessionId);
      return true;
    } catch (e) {
      console.error("Exception sending message:", e);
      return false;
    } finally {
      this.isWorking = false;
      this.workingStatus = "";
      abortController.abort();
    }
  }

  async revert(sessionId, messageId) {
    // To be implemented
  }
}
