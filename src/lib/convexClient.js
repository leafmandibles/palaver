import { ConvexClient } from 'convex/browser';

const DEFAULT_CONVEX_URL = 'http://127.0.0.1:3210';

export function getConvexUrl(env = import.meta.env) {
  return env?.VITE_CONVEX_URL || DEFAULT_CONVEX_URL;
}

export function createPalaverConvexClient(options = {}) {
  return new ConvexClient(getConvexUrl(), options);
}

export async function checkConvexReachability(fetcher = fetch) {
  const response = await fetcher(new URL('/api/health', getConvexUrl()));
  return response.ok;
}
