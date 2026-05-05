<script>
  let { 
    modes = [], 
    models = [], 
    providers = [], 
    currentMode = '', 
    currentModel = '', 
    currentProvider = '',
    type = 'mode', // 'mode', 'model', 'provider'
    onSelectMode,
    onSelectModel,
    onSelectProvider,
    onClose
  } = $props();

  let searchQuery = $state('');

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      onClose();
    }
  }

  $effect(() => {
    // Reset search when type changes
    type;
    searchQuery = '';
  });

  let filteredModes = $derived(modes.filter(m => m.toLowerCase().includes(searchQuery.toLowerCase())));
  // Only show models for the current provider
  let filteredModels = $derived(
    models
      .filter(m => m.providerId === currentProvider)
      .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.id.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  let filteredProviders = $derived(providers.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase())));
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="selector-container" onkeydown={handleKeydown}>
  <div class="search-box">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
    <!-- svelte-ignore a11y_autofocus -->
    <input 
      type="text" 
      bind:value={searchQuery} 
      placeholder="Search {type}..." 
      autofocus
    />
  </div>

  <div class="list-container">
    {#if type === 'mode'}
      {#each filteredModes as mode}
        <button class="list-item {currentMode === mode ? 'selected' : ''}" onclick={() => onSelectMode(mode)}>
          <div class="item-name">{mode}</div>
          {#if currentMode === mode}
            <svg class="check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          {/if}
        </button>
      {/each}
      {#if filteredModes.length === 0}
        <div class="empty-state">No modes found.</div>
      {/if}
    {:else if type === 'provider'}
      {#each filteredProviders as provider}
        <button class="list-item {currentProvider === provider.id ? 'selected' : ''}" onclick={() => onSelectProvider(provider)}>
          <div class="item-name">{provider.name}</div>
          <div class="item-id">{provider.id}</div>
          {#if currentProvider === provider.id}
            <svg class="check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          {/if}
        </button>
      {/each}
      {#if filteredProviders.length === 0}
        <div class="empty-state">No providers found.</div>
      {/if}
    {:else if type === 'model'}
      {#each filteredModels as model}
        <button class="list-item {currentModel === model.id ? 'selected' : ''}" onclick={() => onSelectModel(model)}>
          <div class="item-name">{model.name}</div>
          <div class="item-id">{model.id}</div>
          {#if currentModel === model.id}
            <svg class="check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          {/if}
        </button>
      {/each}
      {#if filteredModels.length === 0}
        <div class="empty-state">No models found for this provider.</div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .selector-container {
    width: 100%;
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    box-shadow: 0 4px 6px -1px var(--shadow-sm), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    max-height: 300px;
  }

  .search-box {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    border-bottom: 1px solid var(--color-border);
    gap: 0.5rem;
    color: var(--color-text-subtle);
    background: var(--color-bg-muted);
  }

  .search-box input {
    background: transparent;
    border: none;
    outline: none;
    width: 100%;
    font-size: 0.9rem;
    color: var(--color-text-muted);
  }

  .list-container {
    overflow-y: auto;
    flex: 1;
  }

  .list-item {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    border-bottom: 1px solid var(--color-bg-muted);
    padding: 0.75rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background-color 0.15s;
  }

  .list-item:hover {
    background: var(--color-bg-muted);
  }

  .list-item.selected {
    background: var(--color-bg-surface-active);
  }

  .item-name {
    font-weight: 500;
    color: var(--color-text-muted);
    font-size: 0.9rem;
  }

  .item-id {
    font-size: 0.75rem;
    color: var(--color-text-subtle);
    margin-top: 0.1rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  }

  .check {
    color: var(--color-link);
    flex-shrink: 0;
  }

  .empty-state {
    padding: 1.5rem;
    text-align: center;
    color: var(--color-text-subtle);
    font-size: 0.9rem;
  }
</style>
