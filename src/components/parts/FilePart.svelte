<script>
  import { getContext } from 'svelte';
  import CollapsiblePart from '../CollapsiblePart.svelte';

  let { part } = $props();
  // Assume it's not rendered inline if showDetails is active, as it's meant for Assistant/System logs here normally
  const showDetails = getContext('showDetails');

  function getFileCategory(mime) {
    if (!mime) return 'unknown';
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime === 'application/pdf') return 'pdf';
    return 'text';
  }

  let category = $derived(getFileCategory(part.mime));
  
  // We only show inline attachments if showDetails is on, because user messages render their own attachments underneath now.
</script>

{#if showDetails?.active !== false}
  {#snippet customHeader()}
    <span class="file-summary">
      <span class="badge {category}">[{category}]</span>
      <span class="filename">{part.url ? part.url.replace('file://', '') : (part.filename || 'Unknown File')}</span>
    </span>
  {/snippet}

  {#if category === 'image'}
    <div class="image-thumbnail">
      <!-- svelte-ignore a11y_img_redundant_alt -->
      <img src={part.url} alt={part.filename || 'Image attachment'} />
    </div>
  {:else}
    <CollapsiblePart header={customHeader} defaultCollapsed={true}>
      <pre class="fallback">{JSON.stringify(part, null, 2)}</pre>
    </CollapsiblePart>
  {/if}
{/if}

<style>
  .image-thumbnail {
    display: inline-block;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    max-width: 250px;
    background: #f9fafb;
    margin-top: 0.5rem;
  }
  .image-thumbnail img {
    display: block;
    max-width: 100%;
    max-height: 250px;
    object-fit: contain;
  }

  .file-summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
  }
  .badge {
    font-weight: bold;
    text-transform: uppercase;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    color: white;
    font-size: 0.75rem;
  }
  .badge.image { background-color: #3b82f6; }
  .badge.video { background-color: #ef4444; }
  .badge.audio { background-color: #10b981; }
  .badge.pdf { background-color: #f59e0b; }
  .badge.text { background-color: #6b7280; }
  .badge.unknown { background-color: #9ca3af; }
  
  .filename {
    font-family: monospace;
    color: #4b5563;
  }
  
  .fallback {
    background: #f1f3f5;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
    overflow-x: auto;
    margin: 0;
  }
</style>
