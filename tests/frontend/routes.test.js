import assert from 'node:assert/strict';
import test from 'node:test';
import { createRoutes, selectSessionHistoryComponent } from '../../src/lib/routes.js';

const components = {
  projectList: 'ProjectList',
  events: 'Events',
  thinClientSessionHistory: 'SessionHistory',
  controlPlaneSessionHistory: 'PSessionHistory',
  session: 'Session',
};

/**
 * Tests that enabled control-plane mode selects the Palaver-owned session history path.
 */
function testControlPlaneSessionHistorySelection() {
  const selected = selectSessionHistoryComponent(
    { isControlPlaneEnabled: () => true },
    components
  );

  assert.equal(selected, components.controlPlaneSessionHistory);
}

/**
 * Tests that disabled control-plane mode keeps the existing thin-client session history path.
 */
function testThinClientSessionHistorySelection() {
  const selected = selectSessionHistoryComponent(
    { isControlPlaneEnabled: () => false },
    components
  );

  assert.equal(selected, components.thinClientSessionHistory);
}

/**
 * Tests that route creation applies the selected session history component to project session URLs.
 */
function testRoutesUseSelectedSessionHistory() {
  const routes = createRoutes(
    { isControlPlaneEnabled: () => true },
    components
  );

  assert.equal(routes['/project/:project_id/sessions'], components.controlPlaneSessionHistory);
  assert.equal(routes['/session/:project_id/:session_id'], components.session);
}

test('selects control-plane session history when enabled', testControlPlaneSessionHistorySelection);
test('selects thin-client session history when disabled', testThinClientSessionHistorySelection);
test('uses the selected session history in app routes', testRoutesUseSelectedSessionHistory);
