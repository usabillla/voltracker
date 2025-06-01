// Global type declarations

declare global {
  interface Window {
    location: Location;
    history: History;
  }

  var window: Window & typeof globalThis;
}

export {};