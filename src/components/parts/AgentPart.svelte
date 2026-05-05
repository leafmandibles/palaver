<script>
  let { part } = $props();

  // Try to extract the agent's name from common properties 
  let agentName = $derived(part.agent || part.name || part.subagent_type || 'System Agent');
</script>

<div class="agent-bar">
  <span class="label">Agent:</span> <strong>{agentName}</strong>
</div>

<style>
  .agent-bar {
    width: 100%;
    background-color: var(--color-bg-muted); /* Light blue block color */
    color: var(--color-link); /* Darker blue text */
    padding: 0.5rem 1rem;
    border-radius: 4px;
    margin: 0.5rem 0;
    text-align: left;
    font-size: 0.85rem;
    box-sizing: border-box;
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  
  .label {
    opacity: 0.8;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
</style>
