// Navigation types for both web and mobile platforms

export type AuthRoutes = {
  login: undefined;
  signup: undefined;
  'forgot-password': undefined;
};

export type MainRoutes = {
  dashboard: undefined;
  vehicles: undefined;
  'vehicle-detail': { vehicleId: number };
  // Future routes will be added here
  // trips: undefined;
  // settings: undefined;
};

export type RootRoutes = AuthRoutes & MainRoutes & {
  'tesla-callback': undefined;
};

// Navigation context type
export interface NavigationContextType {
  navigate: <T extends keyof RootRoutes>(
    route: T,
    params?: RootRoutes[T]
  ) => void;
  goBack: () => void;
  canGoBack: () => boolean;
  currentRoute: keyof RootRoutes | null;
  currentParams: any;
}