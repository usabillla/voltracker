import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { TeslaService } from '../services/tesla';
import { useTesla } from '../hooks/useTesla';

interface TeslaCallbackProps {
  onComplete: () => void;
}

export const TeslaCallback: React.FC<TeslaCallbackProps> = ({ onComplete }) => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing Tesla authentication...');
  const { exchangeCodeForTokens } = useTesla();
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the current URL
        const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
        
        if (!currentUrl) {
          throw new Error('Unable to get current URL');
        }

        // Parse the callback URL for code or error
        const { code, error } = TeslaService.parseCallbackUrl(currentUrl);

        if (error) {
          throw new Error(error);
        }

        if (!code) {
          throw new Error('No authorization code received from Tesla');
        }

        setMessage('Exchanging authorization code for tokens...');

        // Exchange the code for tokens and save vehicles
        await exchangeCodeForTokens(code);

        setStatus('success');
        setMessage('Tesla account connected successfully!');

        // Redirect back to dashboard after a short delay
        setTimeout(() => {
          onComplete();
        }, 2000);

      } catch (error) {
        console.error('Tesla OAuth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Failed to connect Tesla account');

        // Redirect back to dashboard after a short delay
        setTimeout(() => {
          onComplete();
        }, 3000);
      }
    };

    handleCallback();
  }, [exchangeCodeForTokens, onComplete]);

  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {status === 'processing' && (
          <>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.title}>Connecting Tesla Account</Text>
          </>
        )}
        
        {status === 'success' && (
          <>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.title}>Success!</Text>
          </>
        )}
        
        {status === 'error' && (
          <>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={styles.title}>Connection Failed</Text>
          </>
        )}
        
        <Text style={styles.message}>{message}</Text>
        
        {status !== 'processing' && (
          <Text style={styles.redirectText}>
            Redirecting back to dashboard...
          </Text>
        )}
      </View>
    </View>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#000' : '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDark ? '#fff' : '#000',
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: isDark ? '#ccc' : '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  redirectText: {
    fontSize: 14,
    color: isDark ? '#999' : '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  successIcon: {
    fontSize: 48,
  },
  errorIcon: {
    fontSize: 48,
  },
});