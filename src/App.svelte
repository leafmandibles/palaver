<script>
  import { onDestroy, setContext } from 'svelte';
  import Router from 'svelte-spa-router';
  import ProjectList from './ProjectList.svelte';
  import SessionHistory from './SessionHistory.svelte';
  import PSessionHistory from './PSessionHistory.svelte';
  import Session from './Session.svelte';
  import Events from './Events.svelte';
  import ThemeSwitcher from './components/ThemeSwitcher.svelte';
  import Panels from './components/Panels.svelte';
  import Panel from './components/Panel.svelte';
  import { GlobalEvents } from './controllers/GlobalEvents.svelte.js';
  import { releaseFlags } from './lib/releaseFlags.js';
  import { createRoutes } from './lib/routes.js';

  const globalEvents = new GlobalEvents();
  setContext('global.events', globalEvents);
  onDestroy(() => globalEvents.destroy());

  const routes = createRoutes(releaseFlags, {
    projectList: ProjectList,
    events: Events,
    thinClientSessionHistory: SessionHistory,
    controlPlaneSessionHistory: PSessionHistory,
    session: Session,
  });
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
