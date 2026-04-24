<script>
  import { getContext } from 'svelte';

  let { defaultCollapsed = true, title = "Details", children } = $props();
  let initialCollapsed = defaultCollapsed;
  let collapsed = $state(initialCollapsed);

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
    {title}
  </button>
  
  {#if !collapsed}
    <div class="content">
      {@render children()}
    </div>
  {/if}
</div>

<style>
  .collapsible {
    border: 1px solid #dee2e6;
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
    background: #f8f9fa;
    border: none;
    text-align: left;
    cursor: pointer;
    font-weight: 500;
    color: #495057;
  }
  .toggle-btn:hover {
    background: #e9ecef;
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
  .content {
    padding: 0.75rem;
    border-top: 1px solid #dee2e6;
  }
</style>
