import {
  checkConvexReachability,
  createPalaverConvexClient,
  getConvexUrl
} from '../lib/convexClient.js';

export class ConvexController {
  client = createPalaverConvexClient();
  url = getConvexUrl();
  reachable = $state(null);
  error = $state(null);

  async verifyConnection() {
    this.error = null;

    try {
      this.reachable = await checkConvexReachability();
    } catch (err) {
      this.reachable = false;
      this.error = err.message;
    }
  }
}
