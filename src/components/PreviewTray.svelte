<script>
  let { part, onClose } = $props();
</script>

<div class="preview-tray">
  <div class="content">
    {#if part.mime?.startsWith('image/')}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <!-- svelte-ignore a11y_img_redundant_alt -->
      <img src={part.url} alt={part.filename || 'Image attachment'} onclick={onClose} title="Click to close" class="clickable-image" />
    {:else}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="file-placeholder" onclick={onClose} title="Click to close">
        <span>File preview not available</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .preview-tray {
    width: 100%;
    margin-top: 0.5rem;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .content {
    display: flex;
    justify-content: center;
    align-items: center;
    background: transparent;
  }
  
  img {
    max-width: 100%;
    max-height: 500px;
    object-fit: contain;
    border-radius: 4px;
    box-shadow: 0 1px 3px 0 var(--shadow-md);
  }

  .clickable-image {
    cursor: pointer;
    transition: transform 0.1s ease-in-out;
  }

  .clickable-image:hover {
    transform: scale(1.01);
  }

  .file-placeholder {
    color: var(--color-text-subtle);
    font-style: italic;
    cursor: pointer;
  }
</style>