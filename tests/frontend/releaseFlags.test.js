import assert from 'node:assert/strict';
import test from 'node:test';
import { createReleaseFlags, releaseFlags } from '../../src/lib/releaseFlags.js';

/**
 * Tests that the default local release configuration keeps the Palaver control plane disabled.
 */
function testDefaultControlPlaneDisabled() {
  assert.equal(releaseFlags.isControlPlaneEnabled(), false);
}

/**
 * Tests that explicit local release configuration values are interpreted as enabled or disabled.
 */
function testConfiguredControlPlaneValues() {
  const enabledFlags = createReleaseFlags({
    features: {
      'palaver.control_plane': {
        defaultValue: true
      }
    }
  });
  const disabledFlags = createReleaseFlags({
    features: {
      'palaver.control_plane': {
        defaultValue: false
      }
    }
  });

  assert.equal(enabledFlags.isControlPlaneEnabled(), true);
  assert.equal(disabledFlags.isControlPlaneEnabled(), false);
}

test('keeps the control plane disabled by default', testDefaultControlPlaneDisabled);
test('interprets configured control plane values', testConfiguredControlPlaneValues);
