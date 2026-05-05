<script>
  import { getContext } from 'svelte';
  import { SessionListController } from './controllers/SessionListController.svelte.js';
  import { groupItemsByDate } from './utils/date.js';
  import { summarizePath, getPathInfo } from './utils/path.js';
  
  let { params } = $props();
   
  const sessionListCtrl = new SessionListController();
  const globalEvent = getContext('global.events');

  const activeSessionIds = $derived(
    new Set(
      globalEvent.events
        .filter(e => e.project === params.project_id && e.payload?.properties?.sessionID)
        .map(e => e.payload.properties.sessionID)
    )
  );

  async function refreshSessions(projectId) {
    await sessionListCtrl.refresh(projectId);
  }

  const refreshPromise = $derived(refreshSessions(params.project_id));

  const sortedSessions = $derived(
    [...sessionListCtrl.sessions].sort((a, b) => (b.time?.updated || 0) - (a.time?.updated || 0))
  );
  
  const groupedSessions = $derived(groupItemsByDate(sortedSessions));
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
        {#each groupedSessions as group}
          <h3 class="date-header">{group.date}</h3>
          <ul>
            {#each group.items as session}
              <li class:active={activeSessionIds.has(session.id)}>
                <div class="card-top">
                  <a href="#/session/{session.id}">
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
    color: #555;
    font-weight: bold;
  }
  .back-link:hover {
    color: #000;
  }
  .new-session-btn {
    background: transparent;
    border: none;
    color: #0066cc;
    cursor: pointer;
    font-size: 1rem;
    padding: 0;
  }
  .new-session-btn:hover {
    text-decoration: underline;
  }
  .date-header {
    margin: 1.5rem 0 0.5rem 0;
    font-size: 1.2rem;
    color: #333;
    border-bottom: 2px solid #eee;
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
    background-color: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 0.15rem 0.6rem;
    color: #4b5563;
  }
  li:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
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
