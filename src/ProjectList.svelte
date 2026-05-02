<script>
  import { onMount } from 'svelte';
  import { ProjectListController } from './controllers/ProjectListController.svelte.js';
  
  const ctrl = new ProjectListController();

  onMount(() => {
    ctrl.load();
  });
</script>

<div>
  <div class="header">
    <h1>Opencode Projects</h1>
  </div>
  {#if ctrl.loading}
    <p>Loading projects...</p>
  {:else if ctrl.error}
    <p style="color: red;">Error loading projects: {ctrl.error}</p>
  {:else if ctrl.projects.length === 0}
    <p>No projects found.</p>
  {:else}
    <ul>
      {#each ctrl.projects as project}
        <li>
          <a href="#/project/{project.id}/sessions">
            <strong>{project.worktree}</strong>
          </a>
          <br><small>ID: {project.id}</small>
          {#if project.lastUpdated}
            <br><small class="text-muted">Last Active: {new Date(project.lastUpdated).toLocaleString()}</small>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .header h1 {
    margin: 0;
  }
  ul {
    list-style-type: none;
    padding: 0;
  }
  li {
    margin-bottom: 1rem;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  a {
    text-decoration: none;
    color: #0066cc;
  }
  a:hover {
    text-decoration: underline;
  }
  .text-muted {
    color: #666;
  }
</style>