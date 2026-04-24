<script>
  import { onMount } from 'svelte';
  import { SessionListController } from './controllers/SessionListController.svelte.js';
  
  const ctrl = new SessionListController();

  onMount(() => {
    ctrl.load();
  });
</script>

<div>
  <div class="header">
    <h1>Opencode Sessions</h1>
    <button class="new-session-btn" onclick={() => ctrl.createSession()}>[new]</button>
  </div>
  {#if ctrl.loading}
    <p>Loading sessions...</p>
  {:else if ctrl.error}
    <p style="color: red;">Error loading sessions: {ctrl.error}</p>
  {:else if ctrl.sessions.length === 0}
    <p>No sessions found.</p>
  {:else}
    <ul>
      {#each ctrl.sessions as session}
        <li>
          <a href="#/session/{session.id}">
            <strong>{session.title || 'Untitled Session'}</strong> 
          </a>
          {#if session.directory} <br><small>{session.directory}</small>{/if}
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