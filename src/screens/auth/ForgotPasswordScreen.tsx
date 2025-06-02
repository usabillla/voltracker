import React, { useState } from 'react';
import { Screen, Button, Input, Text } from '../../components/shared';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '../../navigation/NavigationContext';
import { validateEmail } from '../../utils/validation';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { resetPassword, loading, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);

  const validateForm = () => {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error);
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  const handleResetPassword = async () => {
    if (validateForm()) {
      await resetPassword(email);
      if (!error) {
        setIsEmailSent(true);
      }
    }
  };

  if (isEmailSent) {
    return (
      <Screen padding centered>
        <Text variant="heading1" style={{ marginBottom: 16, textAlign: 'center' }}>
          Check Your Email
        </Text>
        <Text variant="body" color="textSecondary" style={{ marginBottom: 32, textAlign: 'center' }}>
          We've sent a password reset link to {email}
        </Text>
        <Button
          title="Back to Login"
          onPress={() => navigation.navigate('login')}
        />
      </Screen>
    );
  }

  return (
    <Screen padding>
      <Text variant="heading1" style={{ marginBottom: 16 }}>Reset Password</Text>
      <Text variant="body" color="textSecondary" style={{ marginBottom: 32 }}>
        Enter your email address and we'll send you a link to reset your password.
      </Text>
      
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        error={emailError}
        onFocus={clearError}
      />
      
      {error && (
        <Text variant="body" color="error" style={{ marginBottom: 16 }}>
          {error}
        </Text>
      )}
      
      <Button
        title="Send Reset Link"
        onPress={handleResetPassword}
        loading={loading}
        disabled={loading}
        style={{ marginBottom: 16 }}
      />
      
      <Button
        title="Back to Login"
        variant="ghost"
        onPress={() => navigation.navigate('login')}
      />
    </Screen>
  );
};