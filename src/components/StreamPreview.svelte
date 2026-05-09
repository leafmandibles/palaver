<script>
  import ProgressIndicator from './ProgressIndicator.svelte';
  
  let { status = "", parts = [] } = $props();

  let activeBackgroundPart = $derived(() => {
    if (!parts || parts.length === 0) return null;
    const lastPart = parts[parts.length - 1];
    // Only show preview for background parts
    if (lastPart.type === 'reasoning' || lastPart.type === 'tool') {
      return lastPart;
    }
    return null;
  });

  let previewLines = $derived(() => {
    const part = activeBackgroundPart();
    if (!part) return [];
    
    if (part.type === 'reasoning') {
      const text = part.text || '';
      const lines = text.split('\n');
      return lines.slice(Math.max(lines.length - 10, 0));
    } else if (part.type === 'tool') {
      const name = part.name || part.toolName || part.state?.name || 'Unknown Tool';
      const args = part.state?.input || part.args || '';
      let argsStr = '';
      try {
        argsStr = typeof args === 'string' ? args : JSON.stringify(args, null, 2);
      } catch (e) {
        argsStr = String(args);
      }
      
      const combined = `Tool: ${name}\nArgs: ${argsStr}`;
      const lines = combined.split('\n');
      return lines.slice(Math.max(lines.length - 10, 0));
    }
    return [];
  });
</script>

<div class="stream-preview">
  <ProgressIndicator {status} />
  
  {#if activeBackgroundPart()}
    <div class="preview-window">
      {#each previewLines() as line}
        <div class="preview-line">{line || ' '}</div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .stream-preview {
    display: flex;
    flex-direction: column;
    margin-bottom: 1rem;
  }

  .preview-window {
    background: var(--color-bg-muted, #1e1e1e);
    color: var(--color-text-subtle, #888);
    border: 1px solid var(--color-border, #333);
    border-radius: 6px;
    padding: 0.75rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.85rem;
    line-height: 1.4;
    overflow-x: hidden;
    margin-left: 3rem; /* Indent to align nicely below the spinner */
    max-width: 80%;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
    animation: fadeIn 0.3s ease-in;
  }

  .preview-line {
    white-space: pre-wrap;
    word-break: break-all;
    min-height: 1.4em; /* Ensure empty lines still take up space */
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
