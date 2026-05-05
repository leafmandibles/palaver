<script>
  import { getContext } from 'svelte';

  let { defaultCollapsed = true, title = "Details", header, preview, children } = $props();
  let collapsed = $state(defaultCollapsed);

  const globalCollapse = getContext('globalCollapse');

  $effect(() => {
    if (globalCollapse !== undefined) {
      collapsed = globalCollapse.active;
    }
  });

  function toggle() {
    collapsed = !collapsed;
  }
</script>

<div class="collapsible">
  <button class="toggle-btn" onclick={toggle} aria-expanded={!collapsed}>
    <span class="icon" class:rotated={!collapsed}>▶</span>
    {#if header}
      {@render header()}
    {:else}
      {title}
    {/if}
  </button>
  
  {#if collapsed && preview}
    <div class="preview-content">
      {@render preview({ toggle })}
    </div>
  {/if}

  {#if !collapsed}
    <div class="content">
      {@render children()}
    </div>
  {/if}
</div>

<style>
  .collapsible {
    border: 1px solid var(--color-border);
    border-radius: 6px;
    margin-top: 0.5rem;
    background: white;
    overflow: hidden;
  }
  .toggle-btn {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: var(--color-bg-muted);
    border: none;
    text-align: left;
    cursor: pointer;
    font-weight: 500;
    color: var(--color-text-muted);
  }
  .toggle-btn:hover {
    background: var(--color-bg-muted);
  }
  .icon {
    display: inline-block;
    margin-right: 0.5rem;
    font-size: 0.7rem;
    transition: transform 0.2s ease;
  }
  .icon.rotated {
    transform: rotate(90deg);
  }
  .preview-content {
    padding: 0.5rem 0.75rem;
    border-top: 1px dashed var(--color-border);
    font-size: 0.9em;
    color: var(--color-text-muted);
    background: var(--color-bg-muted);
  }
  .content {
    padding: 0.75rem;
    border-top: 1px solid var(--color-border);
  }
</style>
