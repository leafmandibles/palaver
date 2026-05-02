<script>
  import { SessionListController } from './controllers/SessionListController.svelte.js';
  
  let { params } = $props();
  
  const sessionListCtrl = new SessionListController();

  // 1. A pure async function to handle the fetching sequence
  async function loadFlow(projectId) {
    if (!projectId) return [];
    
    return await sessionListCtrl.load(projectId);
  }

  // 2. Use $derived to create a reactive promise that re-runs if params.project_id changes
  let orchestrationPromise = $derived(loadFlow(params.project_id));
</script>

<div>
  <div class="header">
    <a href="#/" class="back-link">&larr; Projects</a>
    <h1>Project Sessions</h1>
    <button class="new-session-btn" onclick={() => sessionListCtrl.createSession()}>[new]</button>
  </div>

  {#await orchestrationPromise}
    <p>Loading sessions...</p>
  {:then sessions}
    {#if sessions.length === 0}
      <p>No sessions found for this project.</p>
    {:else}
      <ul>
        {#each sessions as session}
          <li>
            <a href="#/session/{session.id}">
              <strong>{session.title || 'Untitled Session'}</strong> 
            </a>
            {#if session.directory} <br><small>{session.directory}</small>{/if}
          </li>
        {/each}
      </ul>
    {/if}
  {:catch err}
    <p style="color: red;">Error loading sessions: {err.message}</p>
    <button onclick={() => { orchestrationPromise = loadFlow(params.project_id); }}>Try Again</button>
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
</style>
