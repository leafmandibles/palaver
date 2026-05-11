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
 * Tests that disabled control-plane mode routes browser OpenCode requests directly to the configured OpenCode server.
 */
function testThinClientOpencodeProxyTarget() {
  const proxy = createDevProxy(
    {
      PALAVER_OPENCODE_SERVER_URL: 'http://127.0.0.1:18002'
    },
    {
      isControlPlaneEnabled: () => false
    }
  );

  assert.equal(proxy['/opencode'].target, 'http://127.0.0.1:18002');
}

/**
 * Tests that disabled control-plane mode strips only the browser-facing OpenCode proxy prefix.
 */
function testThinClientOpencodeProxyRewrite() {
  const proxy = createDevProxy(
    {},
    {
      isControlPlaneEnabled: () => false
    }
  );

  assert.equal(proxy['/opencode'].rewrite('/opencode/session'), '/session');
  assert.equal(proxy['/opencode'].rewrite('/opencode/event'), '/event');
  assert.equal(proxy['/opencode'].rewrite('/opencode/session/abc'), '/session/abc');
}

/**
 * Tests that enabled control-plane mode routes browser OpenCode requests to the configured FastAPI backend.
 */
function testControlPlaneOpencodeProxyTarget() {
  const proxy = createDevProxy(
    {
      PALAVER_BACKEND_URL: 'http://127.0.0.1:15002'
    },
    {
      isControlPlaneEnabled: () => true
    }
  );

  assert.equal(proxy['/opencode'].target, 'http://127.0.0.1:15002');
}

/**
 * Tests that enabled control-plane mode preserves the browser-facing OpenCode path for FastAPI.
 */
function testControlPlaneOpencodeProxyPreservesPath() {
  const proxy = createDevProxy(
    {},
    {
      isControlPlaneEnabled: () => true
    }
  );

  assert.equal(proxy['/opencode'].rewrite, undefined);
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
test('routes thin-client OpenCode traffic to the configured OpenCode server', testThinClientOpencodeProxyTarget);
test('rewrites thin-client OpenCode paths by stripping the parent prefix', testThinClientOpencodeProxyRewrite);
test('routes control-plane OpenCode traffic to FastAPI', testControlPlaneOpencodeProxyTarget);
test('preserves control-plane OpenCode paths for FastAPI', testControlPlaneOpencodeProxyPreservesPath);
