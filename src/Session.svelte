<script>
  import { onMount, setContext } from 'svelte';
  import { SessionController } from './controllers/SessionController.svelte.js';
  import UserMessage from './components/UserMessage.svelte';
  import AssistantMessage from './components/AssistantMessage.svelte';
  import ChatInput from './components/ChatInput.svelte';
  import ModelSelector from './components/ModelSelector.svelte';
  import ProgressIndicator from './components/ProgressIndicator.svelte';

  let { params } = $props();
  const ctrl = new SessionController();

  let showModelSelector = $state(false);
  let selectorType = $state('mode'); // 'mode', 'model', or 'provider'
  let currentMode = $state('plan');
  let currentModel = $state('google/gemini-3.1-pro-preview-customtools');
  let currentProvider = $state('openrouter');

  // Create a reactive object so it can be updated inside the context
  let globalCollapse = $state({ active: false });
  setContext('globalCollapse', globalCollapse);

  let showDetails = $state({ active: false });
  setContext('showDetails', showDetails);

  function toggleCollapse() {
    globalCollapse.active = !globalCollapse.active;
  }

  function toggleDetails() {
    showDetails.active = !showDetails.active;
  }

  let editingTitle = $state(false);
  let editTitleText = $state('');

  function startTitleEdit() {
    if (ctrl.session) {
      editTitleText = ctrl.session.title || 'Untitled Session';
      editingTitle = true;
    }
  }

  async function saveTitleEdit() {
    if (ctrl.session && params.session_id) {
      const newTitle = editTitleText.trim() || 'Untitled Session';
      await ctrl.updateTitle(params.session_id, newTitle);
      editingTitle = false;
    }
  }

  function handleTitleKeydown(e) {
    if (e.key === 'Enter') {
      saveTitleEdit();
    } else if (e.key === 'Escape') {
      editingTitle = false;
    }
  }

  function focusInput(node) {
    node.focus();
    node.select();
  }

  onMount(async () => {
    await ctrl.fetchOptions();
    if (ctrl.modes && ctrl.modes.length > 0) {
      if (!currentMode || !ctrl.modes.includes(currentMode)) {
        currentMode = ctrl.modes.includes('plan') ? 'plan' : ctrl.modes[0];
      }
    }
  });

  $effect(() => {
    if (params.session_id) {
      ctrl.load(params.session_id);
    }
  });

  async function handleSendMessage({ text, attachments = [] }) {
    if (params.session_id) {
      await ctrl.sendMessage(params.session_id, text, attachments, {
        mode: currentMode,
        model: currentModel,
        provider: currentProvider
      });
    }
  }

  function handleSelectMode(mode) {
    currentMode = mode;
    showModelSelector = false;
  }

  function handleSelectProvider(provider) {
    currentProvider = provider.id;
    // Auto-select a model from this provider if current model isn't in it
    const modelsForProvider = ctrl.models.filter(m => m.providerId === provider.id);
    if (modelsForProvider.length > 0 && !modelsForProvider.find(m => m.id === currentModel)) {
      currentModel = modelsForProvider[0].id;
    }
    showModelSelector = false;
  }

  function handleSelectModel(model) {
    currentModel = model.id;
    currentProvider = model.providerId; // update provider to match
    showModelSelector = false;
  }

  function handleSelectorClick(type) {
    if (showModelSelector && selectorType === type) {
      showModelSelector = false;
    } else {
      selectorType = type;
      showModelSelector = true;
    }
  }

  function handleCycleMode() {
    if (ctrl.modes && ctrl.modes.length > 0) {
      const currentIndex = ctrl.modes.indexOf(currentMode);
      const nextIndex = (currentIndex + 1) % ctrl.modes.length;
      currentMode = ctrl.modes[nextIndex];
    }
  }

  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return String(num);
  }

  let currentModelData = $derived(ctrl.models.find(m => m.id === currentModel));
  let modelCost = $derived(() => {
    if (!currentModelData) return null;
    const cost = currentModelData.cost;
    const limit = currentModelData.limit;
    return {
      context: limit?.context ? formatNumber(limit.context) : null,
      input: cost?.input ?? null,
      output: cost?.output ?? null
    };
  });
</script>

<div class="session-container">
  <div class="header">
    <a href="#/" class="back-link">&larr; Back to Sessions</a>
    {#if ctrl.session}
      <div class="title-row">
        {#if editingTitle}
          <input 
            type="text" 
            class="title-input" 
            bind:value={editTitleText} 
            onkeydown={handleTitleKeydown} 
            onblur={saveTitleEdit}
            use:focusInput
          />
        {:else}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <h1 class="clickable-title" onclick={startTitleEdit} title="Click to rename">{ctrl.session.title || 'Untitled Session'}</h1>
        {/if}
        <div class="actions">
          <button class="collapse-btn" onclick={toggleCollapse}>
            {globalCollapse.active ? 'Expand' : 'Collapse'}
          </button>
          <button class="collapse-btn" onclick={toggleDetails}>
            {showDetails.active ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>
    {/if}
  </div>

  {#if ctrl.error}
    <p class="error">Error loading session: {ctrl.error}</p>
  {:else if ctrl.loading}
    <p>Loading session...</p>
  {:else}
    <div class="messages">
      {#if ctrl.messages && ctrl.messages.length > 0}
        {#each ctrl.messages as message}
          {#if message.info?.role === 'user' || message.info?.type === 'UserMessage' || message.info?.role === 'UserMessage'}
            <UserMessage parts={message.parts || []} />
          {:else}
            <AssistantMessage parts={message.parts || []} onFork={() => ctrl.forkSession(params.session_id, message.id)} />
          {/if}
        {/each}
      {:else}
        <p>No messages in this session.</p>
      {/if}

      {#if ctrl.isWorking}
        {#if ctrl.streamingParts && ctrl.streamingParts.size > 0}
          <AssistantMessage parts={Array.from(ctrl.streamingParts.values())} />
        {/if}
        <ProgressIndicator status={ctrl.workingStatus} />
      {/if}
    </div>
  {/if}

  <div class="input-area">
    {#if showModelSelector}
      <ModelSelector 
        modes={ctrl.modes}
        models={ctrl.models}
        providers={ctrl.providers}
        {currentMode}
        {currentModel}
        {currentProvider}
        type={selectorType}
        onSelectMode={handleSelectMode}
        onSelectModel={handleSelectModel}
        onSelectProvider={handleSelectProvider}
        onClose={() => showModelSelector = false}
      />
    {/if}
    <ChatInput
      onsend={handleSendMessage}
      mode={currentMode}
      modelName={ctrl.models.find(m => m.id === currentModel)?.name || currentModel}
      provider={ctrl.providers.find(p => p.id === currentProvider)?.name || currentProvider}
      onSelectorClick={handleSelectorClick}
      onCycleMode={handleCycleMode}
      error={ctrl.sendError}
      modelCost={modelCost()}
    />
  </div>
</div>

<style>
  .session-container {
  }
  .header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
  }
  .back-link {
    display: inline-block;
    margin-bottom: 1rem;
    text-decoration: none;
    color: #0066cc;
  }
  .back-link:hover {
    text-decoration: underline;
  }
  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .title-row h1, .title-input {
    margin: 0;
  }
  .clickable-title {
    cursor: pointer;
    border: 1px solid transparent;
    padding: 2px 4px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  .clickable-title:hover {
    background-color: #f0f0f0;
    border-color: #ddd;
  }
  .title-input {
    font-size: 2em;
    font-weight: bold;
    font-family: inherit;
    border: 1px solid #0066cc;
    border-radius: 4px;
    padding: 2px 4px;
    outline: none;
    width: 100%;
    max-width: 400px;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  .collapse-btn {
    padding: 0.25rem 0.75rem;
    background: #e9ecef;
    border: 1px solid #ced4da;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    color: #495057;
  }
  .collapse-btn:hover {
    background: #dee2e6;
  }
  .error {
    color: red;
  }
  .messages {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-bottom: 2rem; /* Add some padding so last message isn't hidden by input */
  }
  .input-area {
    position: sticky;
    bottom: 0;
    padding: 1rem 0;
    /* Add a subtle gradient or solid color to mask messages scrolling behind it */
    background: linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 20%, #ffffff 100%);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
