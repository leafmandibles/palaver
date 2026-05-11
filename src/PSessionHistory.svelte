<script>
  import SessionHistory from './SessionHistory.svelte';
  import { PSessionListController } from './controllers/PSessionListController.svelte.js';

  let { params } = $props();
  const sessionListCtrl = new PSessionListController();
</script>

<SessionHistory {params} {sessionListCtrl} />
