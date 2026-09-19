import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Dialog, Portal, Divider, useTheme } from 'react-native-paper';
import { signup, loginWithGoogle, loginWithMicrosoft } from '../services/auth';

export default function SignupScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const theme = useTheme();

  const onSubmit = async () => {
    if (password !== confirmPassword) {
      setErr('Passwords do not match');
      return;
    }
  
    setBusy(true);
    setErr(null);
    setShowLoginPrompt(false);
    const res = await signup(username.trim(), password);
    setBusy(false);
    
    if (res.success) {
      if (res.needsConfirmation) {
        setShowEmailDialog(true);
      }
      // If needsConfirmation is false, auth state listener handles navigation
    } else {
      // Check if user already exists
      if (res.error?.includes('already registered') || 
          res.error?.includes('already exists') ||
          res.error?.includes('User already registered')) {
        setShowLoginPrompt(true);
      }
      setErr(res.error || 'Signup failed');
    }
  };

  const handleGoogleLogin = async () => {
    setOauthBusy(true);
    setErr(null);
    setShowLoginPrompt(false);
    const res = await loginWithGoogle();
    setOauthBusy(false);
    if (!res.success) {
      setErr(res.error || 'Google login failed');
    }
    // Navigation is handled by auth state listener
  };

  const handleMicrosoftLogin = async () => {
    setOauthBusy(true);
    setErr(null);
    setShowLoginPrompt(false);
    const res = await loginWithMicrosoft();
    setOauthBusy(false);
    if (!res.success) {
      setErr(res.error || 'Microsoft login failed');
    }
    // Navigation is handled by auth state listener
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.select({ ios: 'padding', android: undefined })} 
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <View style={styles.wrap}>
        <Text variant="headlineLarge" style={{ marginBottom: 8, fontWeight: 'bold', color: theme.colors.onBackground }}>
          Create Account
        </Text>
        <Text variant="bodyMedium" style={{ marginBottom: 24, color: theme.colors.onSurfaceVariant }}>
          Sign up to get started
        </Text>

        {/* OAuth Buttons - Primary */}
        <Button
          mode="outlined"
          onPress={handleGoogleLogin}
          loading={oauthBusy}
          disabled={busy || oauthBusy}
          style={styles.oauthButton}
          icon="google"
        >
          Continue with Google
        </Button>

        <Button
          mode="outlined"
          onPress={handleMicrosoftLogin}
          loading={oauthBusy}
          disabled={busy || oauthBusy}
          style={styles.oauthButton}
          icon="microsoft"
        >
          Continue with Microsoft
        </Button>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <Divider style={styles.divider} />
          <Text variant="bodySmall" style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}>
            or sign up with email
          </Text>
          <Divider style={styles.divider} />
        </View>

        {/* Email/Password Form */}
        <TextInput 
          testID="email-input"
          label="Email" 
          autoCapitalize="none" 
          keyboardType="email-address"
          value={username} 
          onChangeText={(t) => {
            setUsername(t);
            if (err) setErr(null);
            if (showLoginPrompt) setShowLoginPrompt(false);
          }}
          style={{ marginBottom: 12 }}
          mode="outlined"
        />
        <TextInput 
          testID="password-input"
          label="Password" 
          secureTextEntry 
          value={password} 
          onChangeText={(t) => {
            setPassword(t);
            if (err) setErr(null);
            if (showLoginPrompt) setShowLoginPrompt(false);
          }}
          style={{ marginBottom: 12 }}
          mode="outlined"
        />
        <TextInput 
          testID="confirm-password-input"
          label="Confirm Password" 
          secureTextEntry 
          value={confirmPassword} 
          onChangeText={(t) => {
            setConfirmPassword(t);
            if (err) setErr(null);
            if (showLoginPrompt) setShowLoginPrompt(false);
          }}
          style={{ marginBottom: 12 }}
          mode="outlined"
        />
        
        {err && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{err}</Text>
            {showLoginPrompt && (
              <Button
                mode="text"
                onPress={() => navigation.navigate('Login')}
                style={styles.loginPromptButton}
                compact
              >
                Go to Sign In
              </Button>
            )}
          </View>
        )}
        
        <Button 
          mode="contained" 
          onPress={onSubmit} 
          loading={busy} 
          disabled={busy || oauthBusy}
          style={{ marginBottom: 16 }}
        >
          Sign Up
        </Button>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>Already have an account? </Text>
          <Button 
            mode="text" 
            onPress={() => navigation.navigate('Login')}
            compact
          >
            Sign In
          </Button>
        </View>
      </View>

      {/* Email Confirmation Dialog */}
      <Portal>
        <Dialog visible={showEmailDialog} onDismiss={() => setShowEmailDialog(false)}>
          <Dialog.Title>Check Your Email</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              We've sent a confirmation email to {username}. Please check your inbox and click the confirmation link to activate your account.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setShowEmailDialog(false);
              navigation.navigate('Login');
            }}>
              Go to Login
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { 
    flex: 1, 
    padding: 24, 
    justifyContent: 'center' 
  },
  oauthButton: {
    marginBottom: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 12,
  },
  errorContainer: {
    marginBottom: 12,
  },
  errorText: {
    marginBottom: 4,
  },
  loginPromptButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
});