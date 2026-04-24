<script>
  import MessageContent from '../MessageContent.svelte';

  let { part } = $props();
</script>

<div class="text-part">
  <MessageContent content={part.text || part.content || ''} />
</div>

<style>
  .text-part {
    line-height: 1.5;
  }
</style>
