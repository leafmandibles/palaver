<script>
    import { setContext, untrack } from 'svelte';

    let { children, name = 'main' } = $props();

    let panels = $state([]);
    let activeIndex = $state(0);

    setContext(`panel.${untrack(() => name)}`, {
        register: (panel) => {
            panels.push(panel);
            return panels.length - 1;
        },
        isActive: (index) => activeIndex === index,
        setActive: (index) => activeIndex = index,
        get all() {
            return panels;
        }
    });
</script>

<div class="panels">
    {@render children()}
</div>

<style>
    .panels {
        width: 100%;
    }
</style>
