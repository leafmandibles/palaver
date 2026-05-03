<script>
  import CollapsiblePart from '../CollapsiblePart.svelte';
  
  let { part } = $props();
  
  // Try to format tool arguments nicely
  let formattedArgs = $derived(() => {
    const args = part.state?.input || part.args;
    if (!args) return '';
    try {
      if (typeof args === 'string') {
        return JSON.stringify(JSON.parse(args), null, 2);
      }
      return JSON.stringify(args, null, 2);
    } catch {
      return String(args);
    }
  });

  // Try to format tool result nicely
  let formattedResult = $derived(() => {
    const result = part.state?.output || part.result;
    if (!result) return '';
    try {
      if (typeof result === 'string') {
        return JSON.stringify(JSON.parse(result), null, 2);
      }
      return JSON.stringify(result, null, 2);
    } catch {
      return String(result);
    }
  });

  let previewLines = $derived(() => {
    const text = formattedResult();
    const lines = text.split('\n');
    const isTruncated = lines.length > 10;
    const previewText = lines.slice(0, 10).join('\n');
    return {
      text: previewText,
      isTruncated
    };
  });
</script>

<div class="tool-part">
  <CollapsiblePart defaultCollapsed={true}>
    {#snippet header()}
      <div class="tool-header">
        <span class="badge">Tool</span>
        <span class="tool-name">{part.tool || part.name || part.toolName || 'Unknown Tool'}</span>
        {#if part.status || part.state?.status}
          <span class="status {(part.status || part.state?.status).toLowerCase()}">{part.status || part.state?.status}</span>
        {/if}
      </div>
    {/snippet}

    {#snippet preview({ toggle })}
      {#if formattedResult()}
        <div class="section preview">
          <pre>{previewLines().text}</pre>
          {#if previewLines().isTruncated}
            <button class="more-btn" onclick={toggle}>...more</button>
          {/if}
        </div>
      {/if}
    {/snippet}

    {#if part.args || part.state?.input}
      <div class="section">
        <strong>Arguments:</strong>
        <pre>{formattedArgs()}</pre>
      </div>
    {/if}
    
    {#if part.result || part.state?.output}
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
  .status.success, .status.completed { background-color: #d4edda; color: #155724; }
  .status.error, .status.failed { background-color: #f8d7da; color: #721c24; }
  
  .section {
    margin-bottom: 1rem;
  }
  .section.preview {
    margin-bottom: 0;
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
    margin-bottom: 0;
  }
  .more-btn {
    background: none;
    border: none;
    color: #0066cc;
    padding: 0;
    font-size: 0.85rem;
    cursor: pointer;
    text-decoration: underline;
    display: block;
    margin-top: 0.25rem;
  }
  .more-btn:hover {
    color: #004499;
  }
</style>
