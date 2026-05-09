<script>
    import { getContext, untrack } from 'svelte';

    let { children, title, group = 'main' } = $props();

    const panels = getContext(`panel.${untrack(() => group)}`);
    const index = panels?.register({ title: untrack(() => title) });
</script>

{#if !panels || panels.isActive(index)}
    <div class="panel">
        {@render children()}
    </div>
{/if}

<style>
    .panel {
        width: 100%;
        max-width: 600px;
    }
</style>
