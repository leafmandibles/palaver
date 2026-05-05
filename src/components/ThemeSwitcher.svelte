<script>
  import { themeState } from '../lib/theme.svelte.js';
  
  const themes = [
    { id: 'default', label: 'Default' },
    { id: 'brutalist', label: 'Brutalist' },
    { id: 'utilitarian', label: 'Utilitarian' }
  ];
</script>

<div class="theme-switcher">
  <label for="theme-select" class="visually-hidden">Select Theme</label>
  <select 
    id="theme-select"
    value={themeState.current} 
    onchange={(e) => themeState.setTheme(e.target.value)}
  >
    {#each themes as theme}
      <option value={theme.id}>{theme.label}</option>
    {/each}
  </select>
</div>

<style>
  .theme-switcher {
    display: inline-flex;
    align-items: center;
  }
  
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }

  select {
    padding: 0.25rem 0.5rem;
    font-size: 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background-color: var(--color-bg-surface);
    color: var(--color-text-base);
    font-family: var(--font-body);
    cursor: pointer;
    transition: all var(--transition-speed);
  }
  
  select:hover {
    border-color: var(--color-accent);
  }
  
  select:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px var(--color-accent-subtle);
  }
</style>