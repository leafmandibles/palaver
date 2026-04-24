<script>
  import CollapsiblePart from '../CollapsiblePart.svelte';
  
  let { part } = $props();
  
  // Try to format tool arguments nicely
  let formattedArgs = $derived(() => {
    try {
      if (typeof part.args === 'string') {
        return JSON.stringify(JSON.parse(part.args), null, 2);
      }
      return JSON.stringify(part.args, null, 2);
    } catch {
      return String(part.args);
    }
  });

  // Try to format tool result nicely
  let formattedResult = $derived(() => {
    try {
      if (typeof part.result === 'string') {
        return JSON.stringify(JSON.parse(part.result), null, 2);
      }
      return JSON.stringify(part.result, null, 2);
    } catch {
      return String(part.result);
    }
  });
</script>

<div class="tool-part">
  <div class="tool-header">
    <span class="badge">Tool</span>
    <span class="tool-name">{part.name || part.toolName || 'Unknown Tool'}</span>
    {#if part.status}
      <span class="status {part.status.toLowerCase()}">{part.status}</span>
    {/if}
  </div>

  <CollapsiblePart title="Tool Details" defaultCollapsed={false}>
    {#if part.args}
      <div class="section">
        <strong>Arguments:</strong>
        <pre>{formattedArgs()}</pre>
      </div>
    {/if}
    
    {#if part.result}
      <div class="section">
        <strong>Result:</strong>
        <pre>{formattedResult()}</pre>
      </div>
    {/if}
  </CollapsiblePart>
</div>

<style>
  .tool-part {
    margin: 0.5rem 0;
  }
  .tool-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .badge {
    background-color: #6c757d;
    color: white;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    font-size: 0.75rem;
    text-transform: uppercase;
    font-weight: bold;
  }
  .tool-name {
    font-family: monospace;
    font-weight: bold;
    color: #343a40;
  }
  .status {
    font-size: 0.75rem;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
  }
  .status.success { background-color: #d4edda; color: #155724; }
  .status.error { background-color: #f8d7da; color: #721c24; }
  
  .section {
    margin-bottom: 1rem;
  }
  .section:last-child {
    margin-bottom: 0;
  }
  pre {
    background: #f1f3f5;
    padding: 0.5rem;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.85rem;
    margin-top: 0.25rem;
  }
</style>
