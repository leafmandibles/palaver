<script module>
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import { createHighlighter } from 'shiki';

  let highlighter = null;
  let initPromise = null;

  const copyIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

  async function ensureHighlighter() {
    if (highlighter) return highlighter;
    if (!initPromise) {
      initPromise = createHighlighter({
        themes: ['github-dark'],
        langs: ['javascript', 'typescript', 'html', 'css', 'python', 'bash', 'svelte', 'json', 'yaml', 'markdown']
      }).then(h => {
        highlighter = h;
        marked.use({
          renderer: {
            code(token) {
              const lang = token.lang || 'text';
              let codeHtml;
              try {
                codeHtml = highlighter.codeToHtml(token.text, { lang, theme: 'github-dark' });
              } catch (e) {
                codeHtml = `<pre><code>${token.text}</code></pre>`;
              }
              return `<div class="code-block-wrapper">
                <div class="code-block-header">
                  <span class="code-block-lang">${lang}</span>
                  <button class="copy-code-btn" aria-label="Copy code" title="Copy code">
                    ${copyIconSVG}
                  </button>
                </div>
                <div class="code-block-content">
                  ${codeHtml}
                </div>
              </div>`;
            }
          }
        });
        return h;
      });
    }
    return initPromise;
  }
</script>

<script>
  let { content = '', onFork = undefined } = $props();

  let html = $state('');

  // Set initial HTML (without shiki highlighting if not yet loaded)
  html = DOMPurify.sanitize(marked.parse(content, { async: false }));

  $effect(() => {
    let active = true;
    
    const updateHtml = () => {
      if (active) {
        html = DOMPurify.sanitize(marked.parse(content, { async: false }));
      }
    };

    if (!highlighter) {
      ensureHighlighter().then(updateHtml);
    } else {
      updateHtml();
    }

    return () => {
      active = false;
    };
  });

  function handleProseClick(e) {
    const btn = e.target.closest('.copy-code-btn');
    if (btn) {
      const wrapper = btn.closest('.code-block-wrapper');
      const codeEl = wrapper.querySelector('pre code');
      if (codeEl) {
        const text = codeEl.textContent;
        navigator.clipboard.writeText(text);
        
        // Visual feedback
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        setTimeout(() => {
          btn.innerHTML = originalHtml;
        }, 2000);
      }
    }
  }

  function copyResponse() {
    navigator.clipboard.writeText(content);
  }
</script>

<div class="message-content-wrapper">
  <div class="prose markdown-body" onclick={handleProseClick}>
    {@html html}
  </div>
  <div class="message-actions">
    <button class="copy-response-btn" aria-label="Copy response" title="Copy response" onclick={copyResponse}>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
    </button>
    {#if onFork}
      <button class="fork-btn" aria-label="Fork chat from here" title="Fork chat from here" onclick={onFork}>
        [fork]
      </button>
    {/if}
  </div>
</div>

<style>
  .message-content-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .message-actions {
    display: flex;
    justify-content: flex-start;
    margin-top: 0.5rem;
  }

  .copy-response-btn {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s, background-color 0.2s;
  }
  
  .copy-response-btn:hover {
    color: #374151;
    background-color: #f3f4f6;
  }

  .fork-btn {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-family: inherit;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s, background-color 0.2s;
  }

  .fork-btn:hover {
    color: #374151;
    background-color: #f3f4f6;
  }

  .prose {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 16px;
    line-height: 1.65;
    color: #333;
    letter-spacing: -0.01em;
    -webkit-font-smoothing: antialiased;
  }

  /* Headings */
  .prose :global(h1),
  .prose :global(h2),
  .prose :global(h3) {
    font-weight: 600;
    letter-spacing: -0.025em;
    color: var(--text-heading, #18181b);
    margin: 1.4em 0 0.4em;
  }
  .prose :global(h1) { font-size: 1.25rem; }
  .prose :global(h2) { font-size: 1.1rem; }
  .prose :global(h3) { font-size: 0.975rem; }

  /* Paragraphs */
  .prose :global(p) {
    margin: 0.6em 0;
  }

  /* Links — no blue */
  .prose :global(a) {
    color: var(--text-primary, #27272a);
    text-decoration: underline;
    text-decoration-color: rgba(0,0,0,0.25);
    text-underline-offset: 3px;
    transition: text-decoration-color 0.15s;
  }
  .prose :global(a:hover) {
    text-decoration-color: rgba(0,0,0,0.7);
  }

  /* Inline code — neutral, not blue */
  .prose :global(:not(pre) > code) {
    font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
    background: #f3f3f3;
    color: var(--text-code, #3f3f46);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.875em;
    border: 1px solid rgba(0,0,0,0.08);
  }

  /* Code blocks */
  .prose :global(.code-block-wrapper) {
    margin: 1em 0;
    border-radius: 8px;
    background: #1e1e1e;
    border: 1px solid rgba(0,0,0,0.06);
    overflow: hidden;
  }

  .prose :global(.code-block-header) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 1rem;
    background: #2d2d2d;
    border-bottom: 1px solid #3d3d3d;
  }

  .prose :global(.code-block-lang) {
    color: #9ca3af;
    font-size: 0.75rem;
    font-family: 'Inter', -apple-system, sans-serif;
  }

  .prose :global(.copy-code-btn) {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }

  .prose :global(.copy-code-btn:hover) {
    color: #ffffff;
  }

  .prose :global(pre) {
    background: transparent !important;
    border-radius: 0;
    padding: 16px;
    overflow-x: auto;
    margin: 0;
    border: none;
  }
  
  .prose :global(pre code) {
    font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
    font-size: 0.875em;
    line-height: 1.65;
    background: none;
    border: none;
    padding: 0;
    /* Color will be managed by Shiki syntax highlighter */
  }

  /* Lists */
  .prose :global(ol),
  .prose :global(ul) {
    padding-left: 1.25em;
    margin: 0.6em 0;
  }
  .prose :global(li) {
    margin-bottom: 0.3em;
  }
  .prose :global(li strong) {
    color: var(--text-heading, #18181b);
  }

  /* Bold */
  .prose :global(strong) {
    font-weight: 600;
    color: var(--text-heading, #18181b);
  }

  /* Blockquote */
  .prose :global(blockquote) {
    border-left: 2px solid rgba(0,0,0,0.1);
    padding-left: 1em;
    margin: 1em 0;
    color: var(--text-muted, #71717a);
  }

  /* Horizontal rule */
  .prose :global(hr) {
    border: none;
    border-top: 1px solid rgba(0,0,0,0.08);
    margin: 1.5em 0;
  }

  /* Images */
  .prose :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 1em 0;
  }
</style>
