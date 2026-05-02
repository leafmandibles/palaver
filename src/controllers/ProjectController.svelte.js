import { createOpencodeClient } from '@opencode-ai/sdk/client';

export class ProjectController {
  client = createOpencodeClient({ baseUrl: '/opencode' });

  async getProjectInfo(projectId) {
    console.log(`[ProjectController::getProjectInfo] - fetching projects`);
    try {
      const res = await this.client.project.list();
      console.log("ProjectController:getProjectInfo - operation client.project.list", res);
      
      if (res.error) {
         console.error(`[ProjectController::getProjectInfo] - error:`, res.error);
         return null;
      }
      
      const projects = res.data || [];
      const project = projects.find(p => p.id === projectId);
      
      return project || null;
    } catch (err) {
      console.error(`[ProjectController::getProjectInfo] - exception:`, err);
      return null;
    }
  }
}
