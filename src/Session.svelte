<script>
  import { onMount, setContext } from 'svelte';
  import { SessionController } from './controllers/SessionController.svelte.js';
  import UserMessage from './components/UserMessage.svelte';
  import AssistantMessage from './components/AssistantMessage.svelte';
  import ChatInput from './components/ChatInput.svelte';
  import ProgressIndicator from './components/ProgressIndicator.svelte';

  let { params } = $props();
  const ctrl = new SessionController();

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

  $effect(() => {
    if (params.session_id) {
      ctrl.load(params.session_id);
    }
  });

  async function handleSendMessage(text) {
    if (params.session_id) {
      await ctrl.sendMessage(params.session_id, text);
    }
  }
</script>

<div class="session-container">
  <div class="header">
    <a href="#/" class="back-link">&larr; Back to Sessions</a>
    {#if ctrl.session}
      <div class="title-row">
        <h1>{ctrl.session.title || 'Untitled Session'}</h1>
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
            <AssistantMessage parts={message.parts || []} />
          {/if}
        {/each}
      {:else}
        <p>No messages in this session.</p>
      {/if}

      {#if ctrl.isWorking}
        <ProgressIndicator status={ctrl.workingStatus} />
      {/if}
    </div>
  {/if}

  <ChatInput onsend={handleSendMessage} />
</div>

<style>
  .session-container {
    max-width: 800px;
    margin: 0 auto;
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
  .title-row h1 {
    margin: 0;
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
  }
</style>
