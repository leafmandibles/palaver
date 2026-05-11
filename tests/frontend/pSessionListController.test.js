import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.$state = value => value;

/**
 * """
 * Tests that control-plane session creation calls Palaver's owned endpoint.
 * """
 */
async function testCreateSessionCallsControlPlaneEndpoint() {
  const { PSessionListController } = await import('../../src/controllers/PSessionListController.svelte.js');
  const originalFetch = globalThis.fetch;
  const requests = [];
  const ctrl = new PSessionListController();

  ctrl.client = {
    project: {
      list: async () => ({
        data: [
          { id: 'project-1', worktree: '/workspace/project-1' }
        ]
      })
    }
  };
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({}), {
      status: 201,
      headers: { 'content-type': 'application/json' }
    });
  };

  try {
    await ctrl.createSession('project-1');
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, '/session/new?directory=%2Fworkspace%2Fproject-1');
  assert.equal(requests[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(requests[0].options.body), { title: 'New Session' });
}

test('control-plane createSession calls POST /session/new', testCreateSessionCallsControlPlaneEndpoint);
