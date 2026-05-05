<script>
  import { getContext } from 'svelte';
  import { ProjectListController } from './controllers/ProjectListController.svelte.js';
  import { summarizePath } from './utils/path.js';

  const ctrl = new ProjectListController();
  const globalEvent = getContext('global.events');
  
  
  const activeProjectIds = $derived(new Set((globalEvent?.events || []).map(e => e.project)));

  // Run once on initialization (no reactive dependencies needed here)
  let initializationPromise = ctrl.load();
</script>

<div>
  

  <div class="header">
    <h1>Opencode Projects</h1>
  </div>
  {#await initializationPromise}
    <p>Loading projects...</p>
  {:then}
    {#if ctrl.error}
      <p style="color: red;">Error loading projects: {ctrl.error}</p>
    {:else if ctrl.groupedProjects.length === 0}
      <p>No projects found.</p>
    {:else}
      <div class="project-groups">
        {#each ctrl.groupedProjects as group}
          <h3 class="date-header">{group.date}</h3>
          <ul>
            {#each group.items as project}
              <li class:active={activeProjectIds.has(project.id)}>
                <a href="#/project/{project.id}/sessions">
                  <strong title={project.worktree}>
                    {#if activeProjectIds.has(project.id)}
                      <span class="pulse-dot"></span>
                    {/if}
                    {summarizePath(project.worktree)}
                  </strong>
                </a>
                {#if project.time?.updated || project.time?.created}
                  <br><small class="text-muted">Last Active: {new Date(project.time?.updated || project.time?.created).toLocaleTimeString()}</small>
                {/if}
              </li>
            {/each}
          </ul>
        {/each}
      </div>
    {/if}
  {/await}
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
  .date-header {
    margin: 1.5rem 0 0.5rem 0;
    font-size: 1.2rem;
    color: #333;
    /*border-bottom: 2px solid #eee;*/
    padding-bottom: 0.25rem;
  }
  ul {
    list-style-type: none;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
  li {
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background-color: #ffffff;
    flex: 1 1 300px;
    max-width: 450px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    transition: transform 0.2s, box-shadow 0.2s;
    margin-bottom: 0;
  }
  li:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
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

  @keyframes subtle-pulse {
    0% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.1); border-color: #e0e0e0; background-color: #ffffff; }
    50% { box-shadow: 0 0 10px 2px rgba(46, 204, 113, 0.4); border-color: #2ecc71; background-color: #e8f5e9; }
    100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.1); border-color: #e0e0e0; background-color: #ffffff; }
  }

  @keyframes dot-blink {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1); }
  }

  li.active {
    animation: subtle-pulse 2s infinite ease-in-out;
  }

  .pulse-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    background-color: #2ecc71;
    border-radius: 50%;
    margin-right: 6px;
    animation: dot-blink 1.5s infinite ease-in-out;
  }
</style>
