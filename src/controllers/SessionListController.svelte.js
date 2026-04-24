import { createOpencodeClient } from '@opencode-ai/sdk/client';
import { push } from 'svelte-spa-router';

export class SessionListController {
  client = createOpencodeClient({ baseUrl: 'http://127.0.0.1:4096' });
  
  sessions = $state([]);
  error = $state(null);
  loading = $state(true);

  async load() {
    this.loading = true;
    this.error = null;

    try {
      const res = await this.client.session.list();
      if (res.error) {
          this.error = JSON.stringify(res.error);
      } else {
          this.sessions = res.data || [];
      }
    } catch (err) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }

  async createSession() {
    try {
      const res = await this.client.session.create({ body: { title: 'New Session' } });
      if (res.error) {
        this.error = JSON.stringify(res.error);
      } else if (res.data && res.data.id) {
        push(`/session/${res.data.id}`);
      }
    } catch (err) {
      this.error = err.message;
    }
  }
}
