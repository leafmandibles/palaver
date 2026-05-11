import assert from 'node:assert/strict';
import test from 'node:test';
import { createDevProxy, createLocalServiceTargets } from '../../vite.config.js';

/**
 * Tests that local FastAPI and OpenCode service targets can be derived from environment values.
 */
function testConfiguredLocalServiceTargets() {
  const targets = createLocalServiceTargets({
    PALAVER_BACKEND_URL: 'http://127.0.0.1:15001',
    PALAVER_OPENCODE_SERVER_URL: 'http://127.0.0.1:18001'
  });

  assert.equal(targets.fastApiUrl, 'http://127.0.0.1:15001');
  assert.equal(targets.opencodeServerUrl, 'http://127.0.0.1:18001');
}

/**
 * Tests that default local FastAPI and OpenCode service targets use the documented ports.
 */
function testDefaultLocalServiceTargets() {
  const targets = createLocalServiceTargets({});

  assert.equal(targets.fastApiUrl, 'http://127.0.0.1:15000');
  assert.equal(targets.opencodeServerUrl, 'http://127.0.0.1:18000');
}

/**
 * Tests that Vite routes Convex HTTP and websocket traffic to the local self-hosted backend by default.
 */
function testDefaultConvexProxyTarget() {
  const proxy = createDevProxy({});

  assert.equal(proxy['/convex'].target, 'http://127.0.0.1:3210');
  assert.equal(proxy['/convex'].ws, true);
}

/**
 * Tests that local development can override the Convex proxy target without changing Vite routes.
 */
function testConfiguredConvexProxyTarget() {
  const proxy = createDevProxy({
    PALAVER_CONVEX_BACKEND_URL: 'http://127.0.0.1:4321'
  });

  assert.equal(proxy['/convex'].target, 'http://127.0.0.1:4321');
}

/**
 * Tests that Vite strips only the browser-facing Convex proxy prefix before forwarding upstream.
 */
function testConvexProxyRewrite() {
  const proxy = createDevProxy({});

  assert.equal(proxy['/convex'].rewrite('/convex/api/health'), '/api/health');
  assert.equal(proxy['/convex'].rewrite('/convex'), '');
}

test('uses the default local Convex proxy target', testDefaultConvexProxyTarget);
test('uses a configured Convex proxy target', testConfiguredConvexProxyTarget);
test('rewrites the browser-facing Convex proxy prefix', testConvexProxyRewrite);
test('derives local service targets from environment values', testConfiguredLocalServiceTargets);
test('uses default local FastAPI and OpenCode service target ports', testDefaultLocalServiceTargets);
