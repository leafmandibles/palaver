import releaseConfig from '../../release.config.json' with { type: 'json' };

const CONTROL_PLANE_FLAG = 'palaver.control_plane';

function getFeatureDefault(config, flagName) {
  return config?.features?.[flagName]?.defaultValue;
}

export function createReleaseFlags(config = releaseConfig) {
  return {
    isControlPlaneEnabled() {
      return getFeatureDefault(config, CONTROL_PLANE_FLAG) === true;
    }
  };
}

export const releaseFlags = createReleaseFlags();
