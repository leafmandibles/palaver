<script>
  import { getContext } from 'svelte';
  import TextPart from './parts/TextPart.svelte';
  import ToolPart from './parts/ToolPart.svelte';
  import FilePart from './parts/FilePart.svelte';
  import CollapsiblePart from './CollapsiblePart.svelte';
  
  let { part } = $props();
  
  const showDetails = getContext('showDetails');
</script>

{#if part.type === 'text' || part.type === 'file' || showDetails?.active !== false}
  <div class="part-container">
    {#if part.type === 'text'}
      <TextPart {part} />
    {:else if part.type === 'tool'}
      <ToolPart {part} />
    {:else if part.type === 'file'}
      <FilePart {part} />
    {:else if part.type === 'Agents' || part.type === 'agents' || part.type === 'agent'}
      <!-- Agent parts are ignored for now -->
    {:else if part.type === 'SubTask' || part.type === 'subtask'}
      <!-- SubTask parts are ignored for now -->
    {:else}
      <!-- Fallback for unknown parts -->
      <CollapsiblePart title="System Info: {part.type || 'Unknown'}" defaultCollapsed={true}>
        <pre class="fallback">{JSON.stringify(part, null, 2)}</pre>
      </CollapsiblePart>
    {/if}
  </div>
{/if}

<style>
  .part-container {
    margin-bottom: 0.5rem;
  }
  .part-container:last-child {
    margin-bottom: 0;
  }
  .fallback {
    background: #f1f3f5;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
    overflow-x: auto;
  }
</style>
