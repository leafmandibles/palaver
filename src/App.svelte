<script>
  import Router from 'svelte-spa-router';
  import ProjectList from './ProjectList.svelte';
  import SessionHistory from './SessionHistory.svelte';
  import Session from './Session.svelte';
  import Events from './Events.svelte';

  const routes = {
    '/': ProjectList,
    '/events': Events,
    '/project/:project_id/sessions': SessionHistory,
    '/session/:session_id': Session,
  };
</script>

<main>
  <Router {routes} />
</main>

<style>
  main {
    padding: 1rem;
  }
</style>
