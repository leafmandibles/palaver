<script>
  import { onMount, onDestroy, setContext } from 'svelte';
  import { SessionController } from './controllers/SessionController.svelte.js';
  import UserMessage from './components/UserMessage.svelte';
  import AssistantMessage from './components/AssistantMessage.svelte';
  import ChatInput from './components/ChatInput.svelte';
  import ModelSelector from './components/ModelSelector.svelte';
  import ProgressIndicator from './components/ProgressIndicator.svelte';
  import { getPathInfo } from './utils/path.js';

  let { params } = $props();
  const ctrl = new SessionController();

  let forceScroll = $state(false);
  let initialScrollDone = $state(false);

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

  // Initialize the session (runs once on mount / param change via svelte-spa-router)
  if (params.session_id) {
    ctrl.load(params.session_id);
  }

  onDestroy(() => {
    ctrl.unsubscribeFromEvents();
  });

  function isNearBottom() {
    const threshold = 150;
    return (window.scrollY + window.innerHeight) >= (document.documentElement.scrollHeight - threshold);
  }

  function scrollToBottom() {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  }

  $effect(() => {
    // Watch for changes that should trigger auto-scroll
    const _messages = ctrl.messages;
    const _streamingSize = ctrl.streamingParts?.size;
    const _isWorking = ctrl.isWorking;
    const _loading = ctrl.loading;

    // Force scroll exactly once after the initial fetch finishes
    if (!initialScrollDone && !_loading && (_messages.length > 0 || _streamingSize > 0)) {
      setTimeout(() => {
        scrollToBottom();
        initialScrollDone = true;
      }, 0);
    } 
    // Normal auto-scroll behavior
    else if (forceScroll || isNearBottom()) {
      // Use setTimeout to ensure DOM has updated before scrolling
      setTimeout(() => scrollToBottom(), 0);
    }

    if (forceScroll) {
      forceScroll = false;
    }
  });

  async function handleSendMessage({ text, attachments = [] }) {
    if (params.session_id) {
      forceScroll = true;
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

  function getMessageAgent(message) {
    if (message.id?.toString().startsWith('temp-')) return currentMode;
    return message.info?.agent || message.agent;
  }

  function shouldShowAgentDivider(messages, index) {
    const msg = messages[index];
    const isUser = msg.info?.role === 'user' || msg.info?.type === 'UserMessage' || msg.info?.role === 'UserMessage';
    if (!isUser) return false;

    const currentAgent = getMessageAgent(msg);
    if (!currentAgent) return false;

    // Find the previous user message
    let prevUserAgent = null;
    for (let i = index - 1; i >= 0; i--) {
      const pMsg = messages[i];
      const pIsUser = pMsg.info?.role === 'user' || pMsg.info?.type === 'UserMessage' || pMsg.info?.role === 'UserMessage';
      if (pIsUser) {
        prevUserAgent = getMessageAgent(pMsg);
        break;
      }
    }

    return currentAgent !== prevUserAgent;
  }
  function formatFilePath(fullPath) {
    if (!fullPath) return 'unknown';
    if (typeof fullPath !== 'string') fullPath = String(fullPath);
    const parts = fullPath.split(/[/\\]/);
    if (parts.length >= 2) {
      return parts.slice(-2).join('/');
    }
    return fullPath;
  }

  function getPreviousToolCalls(messages, index) {
    let targetAgent = null;
    for (let i = index - 1; i >= 0; i--) {
      const msg = messages[i];
      const isUser = msg.info?.role === 'user' || msg.info?.type === 'UserMessage' || msg.info?.role === 'UserMessage';
      if (isUser) {
        targetAgent = getMessageAgent(msg);
        break;
      }
    }

    if (!targetAgent) return [];

    let tools = [];
    for (let i = index - 1; i >= 0; i--) {
      const msg = messages[i];
      const isUser = msg.info?.role === 'user' || msg.info?.type === 'UserMessage' || msg.info?.role === 'UserMessage';
      
      if (isUser) {
        const agent = getMessageAgent(msg);
        if (agent && agent !== targetAgent) {
          break;
        }
      } else {
        if (msg.parts) {
          for (const part of msg.parts) {
            if (part.type === 'tool') {
              const toolName = part.tool || part.name || part.toolName;
              if (['read', 'edit', 'write'].includes(toolName)) {
                let filePath = 'unknown';
                const args = part.state?.input || part.args;
                if (args) {
                  try {
                    const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
                    filePath = parsedArgs.filePath || parsedArgs.path || 'unknown';
                  } catch (e) {}
                }
                tools.push({
                  tool: toolName,
                  file: formatFilePath(filePath),
                  messageId: msg.info?.id || msg.id
                });
              }
            }
          }
        }
      }
    }
    return tools.reverse();
  }
</script>

<div class="session-container">
  <div class="header">
    <a href={params.project_id ? `#/project/${params.project_id}/sessions` : '#/'} class="back-link">&larr; Back to Sessions</a>
    {#if ctrl.session}
      <div class="title-row">
        <div class="title-and-worktree">
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
          {#if ctrl.session.directory}
            {@const pathInfo = getPathInfo(ctrl.session.directory, ctrl.project?.worktree)}
            {#if pathInfo?.worktree}
              <div class="session-worktree">
                <small title="Worktree Subfolder">{pathInfo.worktree}</small>
              </div>
            {/if}
          {/if}
        </div>
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
        {#each ctrl.messages as message, i}
          <div id="msg-{message.info?.id || message.id}">
            {#if message.info?.role === 'user' || message.info?.type === 'UserMessage' || message.info?.role === 'UserMessage'}
              {#if shouldShowAgentDivider(ctrl.messages, i)}
                {@const prevTools = getPreviousToolCalls(ctrl.messages, i)}
                {#if prevTools.length > 0}
                  <div class="tool-summary">
                    {#each prevTools as t}
                      <div class="tool-summary-item">
                        <button class="tool-badge" onclick={() => document.getElementById(`msg-${t.messageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>{t.tool}</button> : <span class="tool-file">{t.file}</span>
                      </div>
                    {/each}
                  </div>
                {/if}
                <div class="agent-divider">
                  <span class="agent-name">{getMessageAgent(message)}</span>
                </div>
              {/if}
              <UserMessage parts={message.parts || []} />
            {:else}
              <AssistantMessage parts={message.parts || []} onFork={() => ctrl.forkSession(params.session_id, message.info?.id || message.id)} />
            {/if}
          </div>
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
      isWorking={ctrl.isWorking}
      onAbort={() => ctrl.abortSession(params.session_id)}
    />
  </div>
</div>

<style>
  .session-container {
  }
  .header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
  }
  .back-link {
    display: inline-block;
    margin-bottom: 1rem;
    text-decoration: none;
    color: var(--color-accent);
    font-weight: 500;
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
  .title-and-worktree {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }
  .session-worktree {
    background-color: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 0.15rem 0.6rem;
    color: var(--color-text-muted);
    white-space: nowrap;
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
    background-color: var(--color-bg-muted);
    border-color: var(--color-border);
  }
  .title-input {
    font-size: 2em;
    font-weight: bold;
    font-family: inherit;
    border: 1px solid var(--color-accent-muted);
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
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border-subtle);
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    transition: all 0.2s;
  }
  .collapse-btn:hover {
    background: var(--color-border-subtle);
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
    background: linear-gradient(to bottom, rgba(250,250,250,0) 0%, rgba(250,250,250,0.9) 20%, var(--color-bg-base) 100%);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .agent-divider {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin: 1.5rem 0 0.5rem 0;
    padding: 0.25rem 0.5rem;
    background-color: var(--color-accent-muted);
    border-bottom: 1px solid var(--color-accent);
    border-radius: 4px;
  }
  .agent-divider .agent-name {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-bg-surface);
  }
  .tool-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.25rem 0.5rem;
    margin: 0.5rem 0;
    align-items: center;
  }
  .tool-summary-item {
    display: flex;
    align-items: center;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.75rem;
    color: var(--color-text-subtle);
  }
  .tool-badge {
    border: 1px solid var(--color-text-subtle);
    border-radius: 4px;
    padding: 0.1rem 0.3rem;
    margin-right: 0.25rem;
    background-color: transparent;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    transition: background-color 0.2s;
  }
  .tool-badge:hover {
    background-color: var(--color-bg-muted);
  }
  .tool-file {
    color: var(--color-text-muted);
  }
</style>
