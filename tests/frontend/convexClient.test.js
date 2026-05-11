import assert from 'node:assert/strict';
import test from 'node:test';
import { ConvexClient } from 'convex/browser';
import {
  checkConvexReachability,
  createPalaverConvexClient,
  getConvexUrl
} from '../../src/lib/convexClient.js';

/**
 * Tests that Palaver uses the local self-hosted Convex backend by default.
 */
function testDefaultConvexUrl() {
  assert.equal(getConvexUrl({}), 'http://127.0.0.1:3210');
}

/**
 * Tests that local development can override the Convex client target.
 */
function testConfiguredConvexUrl() {
  assert.equal(
    getConvexUrl({ VITE_CONVEX_URL: 'http://localhost:4321' }),
    'http://localhost:4321'
  );
}

/**
 * Tests that the Palaver factory creates an actual Convex browser client without opening a websocket.
 */
function testCreateDisabledConvexClient() {
  const client = createPalaverConvexClient({ disabled: true });

  assert.ok(client instanceof ConvexClient);
  assert.equal(client.disabled, true);
}

/**
 * Tests that the reachability check calls the local Convex health endpoint and reports success.
 */
async function testConvexReachabilityCheck() {
  const urls = [];
  const reachable = await checkConvexReachability(async (url) => {
    urls.push(url.toString());
    return { ok: true };
  });

  assert.equal(reachable, true);
  assert.deepEqual(urls, ['http://127.0.0.1:3210/api/health']);
}

test('uses the default local Convex URL', testDefaultConvexUrl);
test('uses a configured Convex URL', testConfiguredConvexUrl);
test('creates a disabled Convex browser client', testCreateDisabledConvexClient);
test('checks Convex reachability through the health endpoint', testConvexReachabilityCheck);
