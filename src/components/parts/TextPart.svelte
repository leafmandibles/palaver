<script>
  import MessageContent from '../MessageContent.svelte';

  let { part, onFork = undefined } = $props();
</script>

<div class="text-part">
  <MessageContent content={part.text || part.content || ''} {onFork} />
</div>

<style>
  .text-part {
    line-height: 1.5;
  }
</style>
