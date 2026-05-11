import assert from 'node:assert/strict';
import test from 'node:test';
import { createReleaseFlags } from '../../src/lib/releaseFlags.js';
import { createRoutes, selectSessionHistoryComponent } from '../../src/lib/routes.js';

const components = {
  projectList: 'ProjectList',
  events: 'Events',
  thinClientSessionHistory: 'SessionHistory',
  controlPlaneSessionHistory: 'PSessionHistory',
  session: 'Session',
};

/**
 * """
 * Tests that enabled control-plane mode selects the Palaver-owned session history path.
 * """
 */
function testControlPlaneSessionHistorySelection() {
  const selected = selectSessionHistoryComponent(
    { isControlPlaneEnabled: () => true },
    components
  );

  assert.equal(selected, components.controlPlaneSessionHistory);
}

/**
 * """
 * Tests that disabled control-plane mode keeps the existing thin-client session history path.
 * """
 */
function testThinClientSessionHistorySelection() {
  const selected = selectSessionHistoryComponent(
    { isControlPlaneEnabled: () => false },
    components
  );

  assert.equal(selected, components.thinClientSessionHistory);
}

/**
 * """
 * Tests that the shipped default release config keeps the app on the thin-client history path.
 * """
 */
function testDefaultReleaseConfigUsesThinClientSessionHistory() {
  const routes = createRoutes(createReleaseFlags(), components);

  assert.equal(routes['/project/:project_id/sessions'], components.thinClientSessionHistory);
}

/**
 * """
 * Tests that route creation applies the selected session history component to project session URLs.
 * """
 */
function testRoutesUseSelectedSessionHistory() {
  const routes = createRoutes(
    { isControlPlaneEnabled: () => true },
    components
  );

  assert.equal(routes['/project/:project_id/sessions'], components.controlPlaneSessionHistory);
  assert.equal(routes['/session/:project_id/:session_id'], components.session);
}

/**
 * """
 * Tests that session detail routing stays on the OpenCode-compatible Session component in thin-client mode.
 * """
 */
function testThinClientSessionDetailRouteUsesOpenCodeSession() {
  const routes = createRoutes(
    { isControlPlaneEnabled: () => false },
    components
  );

  assert.equal(routes['/session/:project_id/:session_id'], components.session);
}

/**
 * """
 * Tests that session detail routing stays on the OpenCode-compatible Session component in control-plane mode.
 * """
 */
function testControlPlaneSessionDetailRouteUsesOpenCodeSession() {
  const routes = createRoutes(
    { isControlPlaneEnabled: () => true },
    components
  );

  assert.equal(routes['/session/:project_id/:session_id'], components.session);
}

test('selects control-plane session history when enabled', testControlPlaneSessionHistorySelection);
test('selects thin-client session history when disabled', testThinClientSessionHistorySelection);
test('uses thin-client session history with the default release config', testDefaultReleaseConfigUsesThinClientSessionHistory);
test('uses the selected session history in app routes', testRoutesUseSelectedSessionHistory);
test('uses OpenCode-compatible session detail routing in thin-client mode', testThinClientSessionDetailRouteUsesOpenCodeSession);
test('uses OpenCode-compatible session detail routing in control-plane mode', testControlPlaneSessionDetailRouteUsesOpenCodeSession);
