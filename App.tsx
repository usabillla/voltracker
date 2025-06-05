import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Screen } from './src/components/shared';
import { NavigationProvider } from './src/navigation/NavigationContext';
import { Router } from './src/navigation/Router';

function App(): React.JSX.Element {
  return (
    <NavigationProvider>
      <Screen>
        <Router />
        <Analytics />
        <SpeedInsights />
      </Screen>
    </NavigationProvider>
  );
}

export default App;