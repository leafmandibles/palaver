<script>
  let text = $state('');
  
  let { onsend, mode = "Plan", modelName = "Gemini 3.1 Pro Preview Custom Tools", provider = "OpenRouter" } = $props();

  function handleKeydown(event) {
    if (event.key === 'Enter') {
      if (event.ctrlKey || event.shiftKey) {
        return; 
      } else {
        event.preventDefault();
        
        const trimmedText = text.trim();
        if (trimmedText && onsend) {
          onsend(trimmedText);
          text = '';
        }
      }
    }
  }
</script>

<div class="chat-input-wrapper">
  <div class="chat-input-container">
    <textarea
      bind:value={text}
      onkeydown={handleKeydown}
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
        <button class="model-selector">
          <span class="mode">{mode}</span>
          <span class="separator">·</span>
          <span class="model-name">{modelName}</span>
          <span class="provider">{provider}</span>
          <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        
        <button class="icon-btn voice-btn" aria-label="Voice input">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v18M17 8v8M22 10v4M7 8v8M2 10v4"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .chat-input-wrapper {
    position: sticky;
    bottom: 0;
    padding: 1rem 0;
    /* Add a subtle gradient or solid color to mask messages scrolling behind it */
    background: linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 20%, #ffffff 100%);
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

  .model-selector {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.85rem;
    padding: 0.375rem 0.5rem;
    border-radius: 0.375rem;
    transition: background-color 0.2s;
  }

  .model-selector:hover {
    background: #f3f4f6;
  }

  .mode {
    color: #3b82f6; /* A nice blue for the mode */
    font-weight: 500;
  }

  .separator {
    color: #9ca3af;
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
</style>