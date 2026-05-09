<script>
  import { onDestroy, setContext } from 'svelte';
  import Router from 'svelte-spa-router';
  import ProjectList from './ProjectList.svelte';
  import SessionHistory from './SessionHistory.svelte';
  import Session from './Session.svelte';
  import Events from './Events.svelte';
  import ThemeSwitcher from './components/ThemeSwitcher.svelte';
  import Panels from './components/Panels.svelte';
  import Panel from './components/Panel.svelte';
  import { GlobalEvents } from './controllers/GlobalEvents.svelte.js';

  const globalEvents = new GlobalEvents();
  setContext('global.events', globalEvents);
  onDestroy(() => globalEvents.destroy());

  const routes = {
    '/': ProjectList,
    '/events': Events,
    '/project/:project_id/sessions': SessionHistory,
    '/session/:project_id/:session_id': Session,
  };
</script>

<main>
  <header class="app-header">
    <div class="spacer"></div>
    <ThemeSwitcher />
  </header>
  <Panels>
    <Panel title="Main">
      <Router {routes} />
    </Panel>
  </Panels>
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
