<script>
  import { getContext } from 'svelte';
  import PartRenderer from './PartRenderer.svelte';
  
  let { parts = [] } = $props();
  const showDetails = getContext('showDetails');

  let hasVisibleParts = $derived(() => {
    if (showDetails?.active !== false) return true;
    return parts.some(p => p.type === 'text' || p.type === 'file');
  });
</script>

{#if hasVisibleParts()}
  <div class="message assistant-message">
    <div class="content">
      {#each parts as part}
        <PartRenderer {part} />
      {/each}
    </div>
  </div>
{/if}

<style>
  .message {
    display: flex;
    gap: 1rem;
  }
  .content {
    padding: 1rem;
    max-width: 80%;
  }
</style>
