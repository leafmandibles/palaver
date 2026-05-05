<script>
  let text = $state('');
  let pendingAttachments = $state([]);
  
  let { onsend, mode = "Plan", modelName = "Gemini 3.1 Pro Preview Custom Tools", provider = "OpenRouter", onSelectorClick, error = null, modelCost = null, isWorking = false, onAbort = undefined } = $props();

  function handleKeydown(event) {
    if (event.key === 'Enter') {
      if (event.ctrlKey || event.shiftKey) {
        return; 
      } else {
        event.preventDefault();
        
        const trimmedText = text.trim();
        if ((trimmedText || pendingAttachments.length > 0) && onsend) {
          onsend({ text: trimmedText, attachments: [...pendingAttachments] });
          text = '';
          pendingAttachments = [];
        }
      }
    } else if (event.key === 'Escape' && isWorking && onAbort) {
      event.preventDefault();
      onAbort();
    }
  }

  function handlePaste(event) {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image/') !== -1) {
        const file = items[i].getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (e) => {
          pendingAttachments = [
            ...pendingAttachments,
            {
              type: file.type,
              name: file.name || `image-${Date.now()}`,
              url: e.target.result // Base64 Data URL
            }
          ];
        };
        reader.readAsDataURL(file);
      }
    }
  }

  function removeAttachment(index) {
    pendingAttachments = pendingAttachments.filter((_, i) => i !== index);
  }
</script>

<div class="chat-input-wrapper">
  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}
  <div class="chat-input-container">
    {#if pendingAttachments.length > 0}
      <div class="attachments-preview">
        {#each pendingAttachments as attachment, index}
          <div class="attachment-thumbnail">
            <!-- svelte-ignore a11y_img_redundant_alt -->
            <img src={attachment.url} alt="Pasted image preview" />
            <button class="remove-attachment-btn" onclick={() => removeAttachment(index)} aria-label="Remove attachment">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        {/each}
      </div>
    {/if}
    <textarea
      bind:value={text}
      onkeydown={handleKeydown}
      onpaste={handlePaste}
      placeholder="Reply..."
      rows="1"
    ></textarea>
    
    <div class="bottom-bar">
      <button class="icon-btn plus-btn" aria-label="Add attachment">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      
      <div class="right-actions">
        <div class="model-selector-group">
          <button class="selector-part mode" onclick={() => onSelectorClick('mode')}>
            {mode}
          </button>
          <span class="separator">·</span>
          <button class="selector-part model-name" onclick={() => onSelectorClick('model')}>
            {modelName}
          </button>
          <button class="selector-part provider" onclick={() => onSelectorClick('provider')}>
            {provider}
            <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
        
        {#if isWorking && onAbort}
          <button class="icon-btn stop-btn" aria-label="Stop generation" onclick={onAbort}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" />
              <rect x="9" y="9" width="6" height="6" rx="1" fill="white" />
            </svg>
          </button>
        {:else}
          <button class="icon-btn voice-btn" aria-label="Voice input">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3v18M17 8v8M22 10v4M7 8v8M2 10v4"/>
            </svg>
          </button>
        {/if}
      </div>
    </div>
  </div>
  {#if modelCost}
    <div class="cost-summary">
      {#if modelCost.context}
        <span class="cost-item">{modelCost.context}</span>
      {/if}
      {#if modelCost.input !== undefined && modelCost.output !== undefined}
        <span class="cost-separator">·</span>
        <span class="cost-item">${modelCost.input} / ${modelCost.output}</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .chat-input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .error-message {
    color: var(--color-text-error);
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
    background: var(--color-bg-error);
    border: 1px solid var(--color-border-error);
    border-radius: var(--radius-md);
    align-self: center;
    max-width: 100%;
    word-break: break-word;
  }

  .chat-input-container {
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    padding: 0.75rem 1rem;
    background: var(--color-bg-surface);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  textarea {
    width: 100%;
    border: none;
    outline: none;
    resize: none;
    font-family: var(--font-body);
    font-size: 1rem;
    padding: 0.25rem 0;
    color: var(--color-text-base);
    background: transparent;
    line-height: 1.5;
  }

  textarea::placeholder {
    color: var(--color-text-subtle);
  }

  .attachments-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .attachment-thumbnail {
    position: relative;
    width: 60px;
    height: 60px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-bg-base);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .attachment-thumbnail img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .remove-attachment-btn {
    position: absolute;
    top: -4px;
    right: -4px;
    background: var(--color-danger);
    color: var(--color-bg-surface);
    border: none;
    border-radius: var(--radius-full);
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    box-shadow: var(--shadow-btn);
  }

  .remove-attachment-btn:hover {
    background: var(--color-danger-hover);
  }

  .bottom-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-button);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    border-radius: var(--radius-sm);
    transition: background-color var(--transition-speed), color var(--transition-speed);
  }
  
  .icon-btn:hover {
    background: var(--color-bg-muted);
    color: var(--color-text-button-hover);
  }

  .right-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .model-selector-group {
    background: none;
    display: flex;
    align-items: center;
    gap: 0.1rem;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    padding: 0.2rem;
    border-radius: var(--radius-sm);
    transition: background-color var(--transition-speed);
  }

  .model-selector-group:hover {
    background: var(--color-bg-muted);
  }

  .selector-part {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.175rem 0.3rem;
    border-radius: var(--radius-sm);
    display: inline-flex;
    align-items: center;
    font-family: inherit;
  }

  .selector-part:hover {
    background: var(--color-border);
  }

  .mode {
    color: var(--color-accent);
    font-weight: 600;
  }

  .separator {
    color: var(--color-text-subtle);
    padding: 0 0.1rem;
  }

  .model-name {
    color: var(--color-text-base);
  }

  .provider {
    color: var(--color-text-subtle);
  }

  .chevron {
    color: var(--color-text-subtle);
    margin-left: 0.1rem;
    margin-top: 0.1rem;
  }

  .cost-summary {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.35rem;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-text-subtle);
    padding: 0 0.5rem;
    margin-top: -0.25rem;
  }

  .cost-separator {
    color: var(--color-border);
  }

  .cost-item {
    white-space: nowrap;
  }
</style>