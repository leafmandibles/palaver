<script>
  let text = $state('');
  let pendingAttachments = $state([]);
  
  let { onsend, mode = "Plan", modelName = "Gemini 3.1 Pro Preview Custom Tools", provider = "OpenRouter", onSelectorClick, error = null, modelCost = null } = $props();

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
        
        <button class="icon-btn voice-btn" aria-label="Voice input">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v18M17 8v8M22 10v4M7 8v8M2 10v4"/>
          </svg>
        </button>
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
    color: #ef4444;
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    align-self: center;
    max-width: 100%;
    word-break: break-word;
  }

  .chat-input-container {
    border: 1px solid #e5e7eb;
    border-radius: 1.25rem;
    padding: 0.75rem 1rem;
    background: #ffffff;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  textarea {
    width: 100%;
    border: none;
    outline: none;
    resize: none;
    font-family: inherit;
    font-size: 1rem;
    padding: 0.25rem 0;
    color: #374151;
    background: transparent;
    line-height: 1.5;
  }

  textarea::placeholder {
    color: #9ca3af;
  }

  .attachments-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .attachment-thumbnail {
    position: relative;
    width: 60px;
    height: 60px;
    border-radius: 0.375rem;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
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
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  }

  .remove-attachment-btn:hover {
    background: #dc2626;
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
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    border-radius: 0.375rem;
    transition: background-color 0.2s, color 0.2s;
  }
  
  .icon-btn:hover {
    background: #f3f4f6;
    color: #111827;
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
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.85rem;
    padding: 0.2rem;
    border-radius: 0.375rem;
    transition: background-color 0.2s;
  }

  .model-selector-group:hover {
    background: #f3f4f6;
  }

  .selector-part {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.175rem 0.3rem;
    border-radius: 0.25rem;
    display: inline-flex;
    align-items: center;
  }

  .selector-part:hover {
    background: #e5e7eb;
  }

  .mode {
    color: #3b82f6; /* A nice blue for the mode */
    font-weight: 500;
  }

  .separator {
    color: #9ca3af;
    padding: 0 0.1rem;
  }

  .model-name {
    color: #374151; /* Dark gray for model name */
  }

  .provider {
    color: #9ca3af; /* Light gray for provider */
  }

  .chevron {
    color: #9ca3af;
    margin-left: 0.1rem;
    margin-top: 0.1rem;
  }

  .cost-summary {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.35rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.75rem;
    color: #9ca3af;
    padding: 0 0.5rem;
    margin-top: -0.25rem;
  }

  .cost-separator {
    color: #d1d5db;
  }

  .cost-item {
    white-space: nowrap;
  }
</style>