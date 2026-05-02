import { createOpencodeClient } from '@opencode-ai/sdk/client';
import { push } from 'svelte-spa-router';

export class SessionListController {
  client = createOpencodeClient({ baseUrl: '/opencode' });
  
  sessions = $state([]);
  error = $state(null);
  loading = $state(true);

  async load(projectId) {
    console.log(`[SessionListController::load] - started loading sessions for project ${projectId}`);
    this.loading = true;
    this.error = null;

    try {
      // Find the project's worktree to filter by directory
      console.log(`[SessionListController::load] - calling client.project.list()`);
      const allProjectsRes = await this.client.project.list();
      const project = allProjectsRes.data?.find(p => p.id === projectId);

      if (!project) {
          throw new Error("Project not found");
      }

      console.log(`[SessionListController::load] - calling client.session.list() with directory: ${project.worktree}`);
      const res = await this.client.session.list({
        query: { directory: project.worktree }
      });
      console.log("SessionListController:load - operation client.session.list", res);
      
      if (res.error) {
          console.error(`[SessionListController::load] - error from client.session.list:`, res.error);
          this.error = JSON.stringify(res.error);
      } else {
          // The backend does the filtering for us now based on the directory
          this.sessions = res.data || [];
          console.log(`[SessionListController::load] - loaded ${this.sessions.length} sessions for project ${projectId}`);
          return this.sessions;
      }
    } catch (err) {
      console.error(`[SessionListController::load] - caught exception:`, err);
      this.error = err.message;
      throw err;
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
      console.log("SessionListController:createSession - operation client.session.create", res);
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
