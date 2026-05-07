<script>
  import { getContext } from 'svelte';
  import TextPart from './parts/TextPart.svelte';
  import SyntheticTextPart from './parts/SyntheticTextPart.svelte';
  import ToolPart from './parts/ToolPart.svelte';
  import FilePart from './parts/FilePart.svelte';
  import ReasoningPart from './parts/ReasoningPart.svelte';
  import AgentPart from './parts/AgentPart.svelte';
  import CollapsiblePart from './CollapsiblePart.svelte';
  
  let { part, onFork = undefined } = $props();
  
  const showDetails = getContext('showDetails');
</script>

{#if part.type === 'text' || part.type === 'file' || showDetails?.active !== false}
  <div class="part-container">
    {#if part.type === 'text' && part.synthetic}
      <SyntheticTextPart {part} />
    {:else if part.type === 'text'}
      <TextPart {part} {onFork} />
    {:else if part.type === 'tool'}
      <ToolPart {part} />
    {:else if part.type === 'file'}
      <FilePart {part} />
    {:else if part.type === 'reasoning'}
      <ReasoningPart {part} />
    {:else if part.type === 'Agents' || part.type === 'agents' || part.type === 'agent'}
      <AgentPart {part} />
    {:else if part.type === 'SubTask' || part.type === 'subtask' || part.type === 'step-start' || part.type === 'step-finish' || part.type === 'compaction'}
      <!-- Internal system parts are ignored -->
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
    background: var(--color-bg-muted);
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
    overflow-x: auto;
  }
</style>
