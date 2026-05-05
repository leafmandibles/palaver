<script>
  import { setContext } from 'svelte';
  import Router from 'svelte-spa-router';
  import ProjectList from './ProjectList.svelte';
  import SessionHistory from './SessionHistory.svelte';
  import Session from './Session.svelte';
  import Events from './Events.svelte';
  
  

  // Instantiate the single GlobalEvents listener here.
  
  
  // Provide it to all child routes via context.
  

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
