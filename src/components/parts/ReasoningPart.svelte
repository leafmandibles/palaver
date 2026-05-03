<script>
  import CollapsiblePart from '../CollapsiblePart.svelte';
  
  let { part } = $props();
  
  let reasoningText = $derived(() => {
    let text = part.text || '';
    if (part.metadata?.openrouter?.reasoning_details?.[0]?.text) {
      text = part.metadata.openrouter.reasoning_details[0].text;
    }
    return text.trim();
  });

  let paragraphs = $derived(() => {
    return reasoningText().split('\n\n').filter(p => p.trim() !== '');
  });

  let previewLines = $derived(() => {
    const lines = reasoningText().split('\n');
    const isTruncated = lines.length > 10;
    const previewText = lines.slice(0, 10).join('\n');
    return {
      paragraphs: previewText.split('\n\n').filter(p => p.trim() !== ''),
      isTruncated
    };
  });
</script>

<div class="reasoning-part">
  <CollapsiblePart title="Reasoning" defaultCollapsed={true}>
    {#snippet preview({ toggle })}
      <div class="reasoning-content preview">
        {#each previewLines().paragraphs as p}
          <p>{p}</p>
        {/each}
        {#if previewLines().isTruncated}
          <button class="more-btn" onclick={toggle}>...more</button>
        {/if}
      </div>
    {/snippet}

    <div class="reasoning-content">
      {#each paragraphs() as p}
        <p>{p}</p>
      {/each}
    </div>
  </CollapsiblePart>
</div>

<style>
  .reasoning-part {
    margin: 0.5rem 0;
  }
  .reasoning-content {
    font-family: inherit;
    font-size: 0.9em;
    color: #495057;
    line-height: 1.5;
  }
  .reasoning-content.preview {
    color: #6c757d;
  }
  .reasoning-content p {
    margin: 0 0 0.5rem 0;
    white-space: pre-wrap;
  }
  .reasoning-content p:last-child {
    margin-bottom: 0;
  }
  .more-btn {
    background: none;
    border: none;
    color: #0066cc;
    padding: 0;
    font-size: inherit;
    cursor: pointer;
    text-decoration: underline;
    display: inline-block;
    margin-top: 0.25rem;
  }
  .more-btn:hover {
    color: #004499;
  }
</style>