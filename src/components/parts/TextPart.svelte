<script>
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';

  let { part } = $props();

  let html = $derived(
    DOMPurify.sanitize(marked.parse(part.text || part.content || '', { async: false }))
  );
</script>

<div class="text-part">
  <div class="markdown-body">
    {@html html}
  </div>
</div>

<style>
  .text-part {
    line-height: 1.5;
  }
  .markdown-body {
    word-break: break-word;
  }
  
  /* Add some basic markdown styling */
  .markdown-body :global(pre) {
    background-color: #f6f8fa;
    padding: 16px;
    border-radius: 6px;
    overflow: auto;
  }
  .markdown-body :global(code) {
    background-color: #f6f8fa;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: monospace;
  }
  .markdown-body :global(p) {
    margin-bottom: 1em;
    margin-top: 0;
  }
</style>
