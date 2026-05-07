<script>
    let { children } = $props();
</script>

<div class="panel">
    {@render children()}
</div>

<style>
    .panel {
        width: 100%;
        max-width: 600px;
    }
</style>
