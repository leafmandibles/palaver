<script>
  import Router from 'svelte-spa-router';
  import SessionHistory from './SessionHistory.svelte';
  import Session from './Session.svelte';

  const routes = {
    '/': SessionHistory,
    '/session/:session_id': Session,
  };
</script>

<main>
  <Router {routes} />
</main>

<style>
  main {
    padding: 1rem;
    font-family: sans-serif;
  }
</style>