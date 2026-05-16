<script>
  import ProgressIndicator from './ProgressIndicator.svelte';
  import PartRenderer from './PartRenderer.svelte';
  
  let { status = "", parts = [] } = $props();

  const isRenderableLivePart = (part) => {
    if (!part) return false;
    return ['reasoning', 'text', 'tool', 'file', 'agent', 'agents', 'Agents'].includes(part.type);
  };

  let liveParts = $derived(() => {
    return (parts || []).filter(isRenderableLivePart);
  });
</script>

<div class="stream-preview">
  <ProgressIndicator status={status || 'Working...'} />
  
  {#if liveParts().length > 0}
    <div class="live-activity" aria-label="Live assistant activity">
      <div class="activity-label">Live activity</div>
      {#each liveParts() as part (part.id || part.callID || `${part.type}-${liveParts().indexOf(part)}`)}
        <div class="activity-item {part.type}">
          <PartRenderer {part} showBackgroundParts={true} />
        </div>
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

  .live-activity {
    margin-left: 3rem;
    max-width: 80%;
    border-left: 2px solid var(--color-border, #d7dde8);
    padding: 0.25rem 0 0.25rem 1rem;
    animation: fadeIn 0.2s ease-in;
  }

  .activity-label {
    color: var(--color-text-subtle, #888);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
  }

  .activity-item {
    margin-bottom: 0.75rem;
  }

  .activity-item:last-child {
    margin-bottom: 0;
  }

  .activity-item.reasoning {
    opacity: 0.9;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
