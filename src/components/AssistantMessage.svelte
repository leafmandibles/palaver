<script>
  import { getContext } from 'svelte';
  import PartRenderer from './PartRenderer.svelte';
  
  let { parts = [], onFork = undefined, showBackgroundParts = false } = $props();
  const showDetails = getContext('showDetails');

  const isBackgroundPart = (part) => part.type === 'tool' || part.type === 'reasoning';

  let hasVisibleParts = $derived(() => {
    if (showDetails?.active !== false || showBackgroundParts) return true;
    return parts.some(p => p.type === 'text' || p.type === 'file');
  });

  let visibleParts = $derived(() => {
    if (showDetails?.active !== false || showBackgroundParts) return parts;
    return parts.filter(p => p.type === 'text' || p.type === 'file' || !isBackgroundPart(p));
  });
</script>

{#if hasVisibleParts()}
  <div class="message assistant-message">
    <div class="content">
      {#each visibleParts() as part}
        <PartRenderer {part} {onFork} {showBackgroundParts} />
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
