import { createOpencodeClient } from '@opencode-ai/sdk/client';
import { push } from 'svelte-spa-router';

export class SessionListController {
  client = createOpencodeClient({ baseUrl: '/opencode' });
  
  sessions = $state([]);
  project = $state(null);
  error = $state(null);
  loading = $state(true);

  async refresh(projectId) {
    console.log(`[SessionListController::refresh] - started loading sessions for project ${projectId}`);
    this.loading = true;
    this.error = null;
    this.project = null;

    try {
      // Find the project's worktree to filter by directory
      console.log(`[SessionListController::refresh] - calling client.project.list()`);
      const allProjectsRes = await this.client.project.list();
      const project = allProjectsRes.data?.find(p => p.id === projectId);

      if (!project) {
          throw new Error("Project not found");
      }
      
      this.project = project;

      console.log(`[SessionListController::refresh] - calling client.session.list() with scope: 'project', directory: ${project.worktree}`);
      const res = await this.client.session.list({
        query: { scope: 'project', directory: project.worktree }
      });
      console.log("SessionListController:refresh - operation client.session.list", res);
      
      if (res.error) {
          console.error(`[SessionListController::refresh] - error from client.session.list:`, res.error);
          this.error = JSON.stringify(res.error);
      } else {
          // The backend does the filtering for us now based on the directory
          this.sessions = res.data || [];
          console.log(`[SessionListController::refresh] - loaded ${this.sessions.length} sessions for project ${projectId}`);
      }
    } catch (err) {
      console.error(`[SessionListController::refresh] - caught exception:`, err);
      this.error = err.message;
    } finally {
      this.loading = false;
      console.log(`[SessionListController::refresh] - finished`);
    }
  }

  async createSession(projectId) {
    console.log(`[SessionListController::createSession] - started for project ${projectId}`);
    try {
      let directory;
      if (projectId) {
        console.log(`[SessionListController::createSession] - calling client.project.list() to find directory`);
        const allProjectsRes = await this.client.project.list();
        const project = allProjectsRes.data?.find(p => p.id === projectId);
        if (project) {
          directory = project.worktree;
        }
      }

      console.log(`[SessionListController::createSession] - calling client.session.create() with directory: ${directory}`);
      const res = await this.client.session.create({ 
        body: { 
          title: 'New Session'
        },
        ...(directory ? { query: { directory } } : {})
      });
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
