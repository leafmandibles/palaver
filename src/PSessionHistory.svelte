<script>
  import SessionHistory from './SessionHistory.svelte';

  let { params } = $props();
</script>

<SessionHistory {params} />
