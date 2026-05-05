<script>
  import { getContext } from 'svelte';

  const globalEvent = getContext('global.events');
</script>

<div class="events-container">
  <div class="header">
    <h1>Live Events (60s rolling window)</h1>
    <a href="#/" class="back-link">← Back to Projects</a>
  </div>
  
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Project</th>
          <th>Type</th>
          <th>Payload</th>
        </tr>
      </thead>
      <tbody>
        {#each [...(globalEvent?.events || [])].reverse() as event (event.id)}
          <tr>
            <td class="time">{new Date(event.timestamp).toLocaleTimeString()}</td>
            <td class="project">{event.project}</td>
            <td class="type">{event.type}</td>
            <td class="payload">
               <pre>{JSON.stringify(event.payload, null, 2)}</pre>
            </td>
          </tr>
        {/each}
        {#if !globalEvent?.events || globalEvent.events.length === 0}
          <tr>
            <td colspan="4" class="empty">Waiting for events...</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</div>

<style>
  .events-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  .back-link {
    text-decoration: none;
    color: var(--color-link);
    font-weight: bold;
  }
  .back-link:hover {
    text-decoration: underline;
  }
  .table-wrapper {
    overflow-x: auto;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-md);
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border);
    text-align: left;
    vertical-align: top;
  }
  th {
    background-color: var(--color-bg-muted);
    font-weight: 600;
    color: var(--color-text-base);
    position: sticky;
    top: 0;
  }
  .time {
    white-space: nowrap;
    color: var(--color-text-muted);
  }
  .project {
    font-family: monospace;
    font-size: 0.9rem;
  }
  .type {
    font-weight: bold;
    color: var(--color-text-base);
  }
  .payload pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    font-size: 0.8rem;
    max-height: 200px;
    overflow-y: auto;
    background: var(--color-bg-muted);
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid var(--color-border);
  }
  .empty {
    text-align: center;
    color: var(--color-text-subtle);
    padding: 2rem !important;
    font-style: italic;
  }
</style>
