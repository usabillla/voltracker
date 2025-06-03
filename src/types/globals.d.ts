// Global type declarations

declare global {
  interface Window {
    location: Location;
    history: History;
    sessionStorage: Storage;
    crypto: Crypto;
  }

  interface Navigator {
    userAgent: string;
  }

  var window: Window & typeof globalThis;
  var navigator: Navigator;
}

export {};