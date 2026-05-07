<script>
  import { getContext } from 'svelte';
  import { ProjectListController } from './controllers/ProjectListController.svelte.js';
  import { summarizePath } from './utils/path.js';

  const ctrl = new ProjectListController();
  const globalEvents = getContext('global.events');
  const activeProjectIds = $derived.by(() => {
    const knownProjectIds = new Set(ctrl.projects.map(project => project.id));
    return new Set(
      (globalEvents?.events ?? [])
        .map(event => event.project)
        .filter(projectId => knownProjectIds.has(projectId))
    );
  });

  // Run once on initialization (no reactive dependencies needed here)
  let initializationPromise = ctrl.load();
</script>

<div>
  

  <div class="header">
    <h1>Projects</h1>
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
    color: var(--color-text-base);
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
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-bg-surface);
    flex: 1 1 300px;
    max-width: 450px;
    box-shadow: var(--shadow-sm);
    transition: transform var(--transition-speed), box-shadow var(--transition-speed), background-color var(--transition-speed), border-color var(--transition-speed);
    margin-bottom: 0;
  }
  li:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    background-color: var(--color-bg-surface-hover);
  }
  a {
    text-decoration: none;
    color: var(--color-link);
  }
  a:hover {
    text-decoration: underline;
    color: var(--color-link-hover);
  }
  .text-muted {
    color: var(--color-text-muted);
  }

  @keyframes subtle-pulse {
    0% { box-shadow: 0 0 0 0 var(--color-accent-subtle); border-color: var(--color-border); background-color: var(--color-bg-surface); }
    50% { box-shadow: 0 0 10px 2px var(--color-accent-muted); border-color: var(--color-accent); background-color: var(--color-bg-surface-active); }
    100% { box-shadow: 0 0 0 0 var(--color-accent-subtle); border-color: var(--color-border); background-color: var(--color-bg-surface); }
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
    background-color: var(--color-accent);
    border-radius: 50%;
    margin-right: 6px;
    animation: dot-blink 1.5s infinite ease-in-out;
  }
</style>
