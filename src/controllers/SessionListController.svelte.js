import { createOpencodeClient } from '@opencode-ai/sdk/client';
import { push } from 'svelte-spa-router';

export class SessionListController {
  client = createOpencodeClient({ baseUrl: '/opencode' });
  
  sessions = $state([]);
  error = $state(null);
  loading = $state(true);

  async load() {
    console.log(`[SessionListController::load] - started loading sessions`);
    this.loading = true;
    this.error = null;

    try {
      console.log(`[SessionListController::load] - calling client.session.list()`);
      const res = await this.client.session.list();
      if (res.error) {
          console.error(`[SessionListController::load] - error from client.session.list:`, res.error);
          this.error = JSON.stringify(res.error);
      } else {
          console.log(`[SessionListController::load] - loaded ${res.data?.length || 0} sessions`);
          this.sessions = res.data || [];
      }
    } catch (err) {
      console.error(`[SessionListController::load] - caught exception:`, err);
      this.error = err.message;
    } finally {
      this.loading = false;
      console.log(`[SessionListController::load] - finished`);
    }
  }

  async createSession() {
    console.log(`[SessionListController::createSession] - started`);
    try {
      console.log(`[SessionListController::createSession] - calling client.session.create()`);
      const res = await this.client.session.create({ body: { title: 'New Session' } });
      if (res.error) {
        console.error(`[SessionListController::createSession] - error from client.session.create:`, res.error);
        this.error = JSON.stringify(res.error);
      } else if (res.data && res.data.id) {
        console.log(`[SessionListController::createSession] - session created, redirecting to /session/${res.data.id}`);
        push(`/session/${res.data.id}`);
      }
    } catch (err) {
      console.error(`[SessionListController::createSession] - caught exception:`, err);
      this.error = err.message;
    }
  }
}
