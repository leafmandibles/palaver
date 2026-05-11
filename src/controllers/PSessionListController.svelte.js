import { push } from 'svelte-spa-router';
import { SessionListController } from './SessionListController.svelte.js';

export class PSessionListController extends SessionListController {
  async createSession(projectId) {
    console.log(`[PSessionListController::createSession] - started for project ${projectId}`);
    this.error = null;

    try {
      let directory;
      if (projectId) {
        console.log(`[PSessionListController::createSession] - calling client.project.list() to find directory`);
        const allProjectsRes = await this.client.project.list();
        const project = allProjectsRes.data?.find(p => p.id === projectId);
        if (project) {
          directory = project.worktree;
        }
      }

      const query = directory ? `?${new URLSearchParams({ directory })}` : '';
      console.log(`[PSessionListController::createSession] - calling /session/new with directory: ${directory}`);
      const response = await fetch(`/session/new${query}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ title: 'New Session' })
      });

      const data = await response.json();
      if (!response.ok) {
        console.error(`[PSessionListController::createSession] - error from /session/new:`, data);
        this.error = JSON.stringify(data);
      } else if (data?.id) {
        console.log(`[PSessionListController::createSession] - session created, redirecting to /session/${projectId}/${data.id}`);
        push(`/session/${projectId}/${data.id}`);
      }
    } catch (err) {
      console.error(`[PSessionListController::createSession] - caught exception:`, err);
      this.error = err.message;
    }
  }
}
