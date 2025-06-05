import React, { useState } from 'react';
import { Screen, Button, Input, Text } from '../../components/shared';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '../../navigation/NavigationContext';
import { validateEmail, validatePassword } from '../../utils/validation';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { signIn, loading, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateForm = () => {
    let isValid = true;
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || '');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error || '');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    return isValid;
  };

  const handleLogin = async () => {
    if (validateForm()) {
      await signIn({ email, password });
    }
  };

  return (
    <Screen padding>
      <Text variant="heading1" style={{ marginBottom: 32 }}>Welcome Back</Text>
      
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        error={emailError || undefined}
        onFocus={clearError}
      />
      
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={passwordError || undefined}
        onFocus={clearError}
      />
      
      {error && (
        <Text variant="body" color="error" style={{ marginBottom: 16 }}>
          {error}
        </Text>
      )}
      
      <Button
        title="Sign In"
        onPress={handleLogin}
        loading={loading}
        disabled={loading}
        style={{ marginBottom: 16 }}
      />
      
      <Button
        title="Forgot Password?"
        variant="ghost"
        onPress={() => navigation.navigate('forgot-password')}
        style={{ marginBottom: 16 }}
      />
      
      <Button
        title="Don't have an account? Sign Up"
        variant="ghost"
        onPress={() => navigation.navigate('signup')}
      />
    </Screen>
  );
};
