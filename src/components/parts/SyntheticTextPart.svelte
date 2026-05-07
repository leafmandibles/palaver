<script>
  let { part } = $props();

  const previewLineCount = 10;
  let expanded = $state(false);

  const text = $derived(part.text || part.content || '');
  const isReadToolCall = $derived(text.startsWith('Called the Read tool with the following input:'));
  const fileContent = $derived(parseReadToolContent(text));
  const visibleLines = $derived(
    expanded ? fileContent?.lines || [] : fileContent?.lines.slice(0, previewLineCount) || []
  );
  const hasMore = $derived((fileContent?.lines.length || 0) > previewLineCount);

  function parseReadToolContent(value) {
    const contentMatch = value.match(/<content>\n([\s\S]*?)\n<\/content>/);
    if (!contentMatch) return null;

    const pathMatch = value.match(/<path>([\s\S]*?)<\/path>/);
    const lines = contentMatch[1].split('\n');

    return {
      path: pathMatch?.[1] || 'File contents',
      filename: getFilename(pathMatch?.[1] || 'File contents'),
      lines
    };
  }

  function getFilename(path) {
    return path.split(/[\\/]/).pop() || path;
  }
</script>

{#if isReadToolCall}
  <!-- Redundant tool-call metadata is intentionally hidden. -->
{:else if fileContent}
  <div class="synthetic-block file-output">
    <div class="synthetic-label">Read tool output</div>
    <div class="file-path" title={fileContent.path}>{fileContent.filename}</div>
    <pre class="file-content">{visibleLines.join('\n')}</pre>
    {#if hasMore}
      <button class="more-button" type="button" onclick={() => expanded = !expanded}>
        {expanded ? 'less' : 'more'}
      </button>
    {/if}
  </div>
{:else}
  <div class="synthetic-block">
    <pre>{text}</pre>
  </div>
{/if}

<style>
  .synthetic-block {
    background: var(--color-bg-base);
    border: 1px solid var(--color-border-subtle);
    border-radius: 8px;
    color: var(--color-text-muted);
    font-size: 0.85rem;
    margin-top: 0.75rem;
    padding: 0.75rem;
  }

  .synthetic-label {
    color: var(--color-text-subtle);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    margin-bottom: 0.35rem;
    text-transform: uppercase;
  }

  .file-path {
    color: var(--color-text-muted);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.65rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  pre {
    margin: 0;
    white-space: pre-wrap;
  }

  .file-content {
    color: var(--color-text-base);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.82rem;
    line-height: 1.55;
    overflow-x: auto;
    tab-size: 2;
  }

  .more-button {
    background: transparent;
    border: 0;
    color: var(--color-link);
    cursor: pointer;
    font: inherit;
    margin-top: 0.5rem;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
</style>
