import assert from 'node:assert/strict';
import test from 'node:test';
import { releaseFlags } from '../../src/lib/releaseFlags.js';

/**
 * Tests that the default local release configuration keeps the Palaver control plane disabled.
 */
function testDefaultControlPlaneDisabled() {
  assert.equal(releaseFlags.isControlPlaneEnabled(), false);
}

test('keeps the control plane disabled by default', testDefaultControlPlaneDisabled);
