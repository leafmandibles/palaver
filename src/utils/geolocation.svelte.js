export class GeolocationState {
  location = $state(null);
  error = $state(null);

  constructor() {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        },
        (error) => {
          console.error("Error getting location:", error);
          this.error = error.message;
        }
      );
    } else {
      this.error = "Geolocation is not supported by this browser.";
    }
  }
}