import React from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Screen } from './src/components/shared';
import { NavigationProvider } from './src/navigation/NavigationContext';
import { Router } from './src/navigation/Router';

function App(): React.JSX.Element {
  return (
    <NavigationProvider>
      <Screen>
        <Router />
        <SpeedInsights />
      </Screen>
    </NavigationProvider>
  );
}

export default App;