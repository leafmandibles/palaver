<script>
  import { getContext } from 'svelte';
  import PartRenderer from './PartRenderer.svelte';
  
  let { parts = [] } = $props();
  const showDetails = getContext('showDetails');

  // Separate file parts from other parts
  let fileParts = $derived(parts.filter(p => p.type === 'file'));
  let mainParts = $derived(parts.filter(p => p.type !== 'file'));

  let hasVisibleParts = $derived(() => {
    if (showDetails?.active !== false) return true;
    return parts.some(p => p.type === 'text' || p.type === 'file');
  });
</script>

{#if hasVisibleParts()}
  <div class="message-wrapper user-message-wrapper">
    {#if mainParts.length > 0}
      <div class="message user-message">
        <div class="content">
          {#each mainParts as part}
            <PartRenderer {part} />
          {/each}
        </div>
      </div>
    {/if}

    {#if fileParts.length > 0}
      <div class="attachments-container">
        {#each fileParts as part}
          {#if part.mime?.startsWith('image/')}
            <div class="image-thumbnail">
              <!-- svelte-ignore a11y_img_redundant_alt -->
              <img src={part.url} alt={part.filename || 'Image attachment'} />
            </div>
          {:else}
            <div class="file-thumbnail">
              <span class="file-icon">📄</span>
              <span class="file-name">{part.filename || 'Attachment'}</span>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .message-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-end; /* Align everything to the right for user messages */
  }

  .message {
    display: flex;
    gap: 1rem;
    flex-direction: row-reverse;
    width: 100%;
  }

  .content {
    background-color: #4a674940;
    padding: 1rem;
    border-radius: 8px;
    border-top-right-radius: 0;
    max-width: 100%;
  }

  .attachments-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: flex-end; /* Right align attachments */
    max-width: 80%;
  }

  .image-thumbnail {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    max-width: 200px; /* Adjust size as needed to match the screenshot */
  }

  .image-thumbnail img {
    display: block;
    max-width: 100%;
    max-height: 150px;
    object-fit: cover;
  }

  .file-thumbnail {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #ffffff;
    font-size: 0.85rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .file-icon {
    font-size: 1.2em;
  }

  .file-name {
    font-family: monospace;
    color: #4b5563;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
