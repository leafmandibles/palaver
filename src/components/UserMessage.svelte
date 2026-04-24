<script>
  import { getContext } from 'svelte';
  import PartRenderer from './PartRenderer.svelte';
  
  let { parts = [] } = $props();
  const showDetails = getContext('showDetails');

  let hasVisibleParts = $derived(() => {
    if (showDetails?.active !== false) return true;
    return parts.some(p => p.type === 'text');
  });
</script>

{#if hasVisibleParts()}
  <div class="message user-message">
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
  .user-message {
    flex-direction: row-reverse;
  }
  .content {
    background-color: #4a674940;
    padding: 1rem;
    border-radius: 8px;
    border-top-right-radius: 0;
    max-width: 100%;
  }
</style>
