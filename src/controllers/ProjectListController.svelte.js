import { createOpencodeClient } from '@opencode-ai/sdk/client';

export class ProjectListController {
  client = createOpencodeClient({ baseUrl: '/opencode' });
  
  projects = $state([]);
  error = $state(null);
  loading = $state(true);

  async load() {
    this.loading = true;
    this.error = null;

    try {
      const projectRes = await this.client.project.list();

      console.log("ProjectListController:load - operation client.project.list", projectRes);

      if (projectRes.error) {
        this.error = JSON.stringify(projectRes.error);
      } else {
        const rawProjects = projectRes.data || [];
        
        // Sort directly on the project's updated timestamp (newest first)
        this.projects = rawProjects.sort((a, b) => 
          (b.time?.updated || 0) - (a.time?.updated || 0)
        );
      }
    } catch (err) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }
}
