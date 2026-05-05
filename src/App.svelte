<script>
  import Router from 'svelte-spa-router';
  import ProjectList from './ProjectList.svelte';
  import SessionHistory from './SessionHistory.svelte';
  import Session from './Session.svelte';
  import Events from './Events.svelte';
  import ThemeSwitcher from './components/ThemeSwitcher.svelte';

  const routes = {
    '/': ProjectList,
    '/events': Events,
    '/project/:project_id/sessions': SessionHistory,
    '/session/:session_id': Session,
  };
</script>

<main>
  <header class="app-header">
    <div class="spacer"></div>
    <ThemeSwitcher />
  </header>
  <Router {routes} />
</main>

<style>
  main {
    padding: 1rem;
  }
  .app-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 1rem;
  }
</style>
