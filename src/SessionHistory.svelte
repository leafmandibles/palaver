<script>
  import { SessionListController } from './controllers/SessionListController.svelte.js';
  import { groupItemsByDate } from './utils/date.js';
  import { summarizePath, getPathInfo } from './utils/path.js';
   
  let { params } = $props();
    
  const sessionListCtrl = new SessionListController();
  const activeSessionIds = $derived(new Set());
  let selectedWorktrees = $state(new Set());

  async function refreshSessions(projectId) {
    await Promise.resolve();
    await sessionListCtrl.refresh(projectId);
  }

  const refreshPromise = $derived(refreshSessions(params.project_id));

  const sortedSessions = $derived(
    [...sessionListCtrl.sessions].sort((a, b) => (b.time?.updated || 0) - (a.time?.updated || 0))
  );

  function getSessionWorktree(session) {
    if (!session.directory || !sessionListCtrl.project) return 'root';

    const pathInfo = getPathInfo(session.directory, sessionListCtrl.project.worktree);
    return pathInfo?.worktree ? pathInfo.worktree : 'root';
  }

  function toggleWorktree(worktree) {
    const nextSelectedWorktrees = new Set(selectedWorktrees);
    if (nextSelectedWorktrees.has(worktree)) {
      nextSelectedWorktrees.delete(worktree);
    } else {
      nextSelectedWorktrees.add(worktree);
    }
    selectedWorktrees = nextSelectedWorktrees;
  }

  const filteredSessions = $derived.by(() => {
    if (selectedWorktrees.size === 0) return sortedSessions;

    return sortedSessions.filter(session => selectedWorktrees.has(getSessionWorktree(session)));
  });
  
  const groupedSessions = $derived(groupItemsByDate(filteredSessions));

  const globalWorktrees = $derived.by(() => {
    const worktrees = new Set();
    if (!sessionListCtrl.project) return [];
    for (const session of sortedSessions) {
      if (session.directory) {
        const pathInfo = getPathInfo(session.directory, sessionListCtrl.project.worktree);
        worktrees.add(pathInfo?.worktree ? pathInfo.worktree : 'root');
      } else {
        worktrees.add('root');
      }
    }
    return Array.from(worktrees).sort((a, b) => {
      if (a === 'root') return -1;
      if (b === 'root') return 1;
      return a.localeCompare(b);
    });
  });
</script>

<div>
  <div class="header">
    <a href="#/" class="back-link">&larr; Projects</a>
    <h1>{sessionListCtrl.project ? summarizePath(sessionListCtrl.project.worktree) : 'Loading...'}</h1>
    <button class="new-session-btn" onclick={() => sessionListCtrl.createSession(params.project_id)}>[new]</button>
  </div>

  {#await refreshPromise}
    <p>Loading sessions...</p>
  {:then}
    {#if sessionListCtrl.loading}
      <p>Loading sessions...</p>
    {:else if sessionListCtrl.error}
      <p style="color: red;">Error loading sessions: {sessionListCtrl.error}</p>
      <button onclick={() => sessionListCtrl.refresh(params.project_id)}>Try Again</button>
    {:else if sortedSessions.length === 0}
      <p>No sessions found for this project.</p>
    {:else}
      <div class="session-groups">
        {#each groupedSessions as group, i}
          <div class="date-header-container">
            <h3 class="date-header">{group.date}</h3>
            {#if i === 0 && globalWorktrees.length > 0}
              <div class="global-worktrees">
                {#each globalWorktrees as wt}
                  <button
                    class="worktree-pill"
                    class:selected={selectedWorktrees.has(wt)}
                    onclick={() => toggleWorktree(wt)}
                  >
                    {wt}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
          <ul>
            {#each group.items as session}
              <li class:active={activeSessionIds.has(session.id)}>
                <div class="card-top">
                  <a href="#/session/{params.project_id}/{session.id}">
                    <strong>
                      {#if activeSessionIds.has(session.id)}
                        <span class="pulse-dot"></span>
                      {/if}
                      {session.title || 'Untitled Session'}
                    </strong> 
                  </a>
                  {#if session.directory} 
                    {@const pathInfo = getPathInfo(session.directory, sessionListCtrl.project?.worktree)}
                    <div class="session-path">
                      <small title={session.directory}>{pathInfo?.basePath}</small>
                    </div>
                  {/if}
                </div>
                <div class="card-bottom">
                  <div class="session-time">
                    {#if session.time?.updated || session.time?.created}
                      <small class="text-muted">Last Active: {new Date(session.time?.updated || session.time?.created).toLocaleTimeString()}</small>
                    {/if}
                  </div>
                  {#if session.directory}
                    {@const pathInfo = getPathInfo(session.directory, sessionListCtrl.project?.worktree)}
                    {#if pathInfo?.worktree}
                      <div class="session-worktree">
                        <small title="Worktree Subfolder">{pathInfo.worktree}</small>
                      </div>
                    {/if}
                  {/if}
                </div>
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
  .back-link {
    text-decoration: none;
    color: var(--color-text-muted);
    font-weight: bold;
  }
  .back-link:hover {
    color: var(--color-text-base);
  }
  .new-session-btn {
    background: transparent;
    border: none;
    color: var(--color-link);
    cursor: pointer;
    font-size: 1rem;
    padding: 0;
  }
  .new-session-btn:hover {
    text-decoration: underline;
  }
  .date-header-container {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    margin: 1.5rem 0 0.5rem 0;
    border-bottom: 2px solid var(--color-border);
    padding-bottom: 0.25rem;
  }
  .date-header {
    margin: 0;
    font-size: 1.2rem;
    color: var(--color-text-base);
  }
  .global-worktrees {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .worktree-pill {
    background-color: var(--color-bg-muted);
    color: var(--color-text-muted);
    font-size: 0.85rem;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    border: 1px solid var(--color-border);
    cursor: pointer;
    font-family: inherit;
  }
  .worktree-pill:hover {
    background-color: var(--color-border);
  }
  .worktree-pill.selected {
    background-color: var(--color-bg-muted);
    border-color: var(--color-border);
    color: var(--color-link);
  }
  ul {
    list-style-type: none;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
  a {
    text-decoration: none;
    color: var(--color-link);
  }
  a:hover {
    text-decoration: underline;
    color: var(--color-link-hover);
  }
  li {
    padding: 1rem;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background-color: var(--color-bg-surface);
    flex: 1 1 300px;
    max-width: 450px;
    box-shadow: 0 2px 4px var(--shadow-sm);
    transition: transform 0.2s, box-shadow 0.2s;
    margin-bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .card-top {
    margin-bottom: 0.5rem;
  }
  .session-path {
    margin-top: 0.25rem;
  }
  .card-bottom {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 0.5rem;
  }
  .session-worktree {
    background-color: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 0.15rem 0.6rem;
    color: var(--color-text-muted);
  }
  li:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px var(--shadow-md);
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
