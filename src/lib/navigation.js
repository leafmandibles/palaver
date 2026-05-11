export async function navigate(path) {
  const { push } = await import('svelte-spa-router');
  push(path);
}
