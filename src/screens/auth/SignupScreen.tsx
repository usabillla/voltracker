import React, { useState } from 'react';
import { Screen, Button, Input, Text } from '../../components/shared';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '../../navigation/NavigationContext';
import { validateEmail, validatePassword, validateConfirmPassword } from '../../utils/validation';

export const SignupScreen: React.FC = () => {
  const navigation = useNavigation();
  const { signUp, loading, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validateForm = () => {
    let isValid = true;
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error);
      isValid = false;
    } else {
      setEmailError('');
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error);
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    const confirmPasswordValidation = validateConfirmPassword(password, confirmPassword);
    if (!confirmPasswordValidation.isValid) {
      setConfirmPasswordError(confirmPasswordValidation.error);
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }
    
    return isValid;
  };

  const handleSignUp = async () => {
    if (validateForm()) {
      await signUp({ email, password });
    }
  };

  return (
    <Screen padding>
      <Text variant="heading1" style={{ marginBottom: 32 }}>Create Account</Text>
      
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        error={emailError}
        onFocus={clearError}
      />
      
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={passwordError}
        onFocus={clearError}
      />
      
      <Input
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        error={confirmPasswordError}
        onFocus={clearError}
      />
      
      {error && (
        <Text variant="body" color="error" style={{ marginBottom: 16 }}>
          {error}
        </Text>
      )}
      
      <Button
        title="Sign Up"
        onPress={handleSignUp}
        loading={loading}
        disabled={loading}
        style={{ marginBottom: 16 }}
      />
      
      <Button
        title="Already have an account? Sign In"
        variant="ghost"
        onPress={() => navigation.navigate('login')}
      />
    </Screen>
  );
};
