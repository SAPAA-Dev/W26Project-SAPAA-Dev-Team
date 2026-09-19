import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, StyleSheet, Image } from 'react-native';
import { TextInput, Button, Text, Divider, useTheme } from 'react-native-paper';
import { login, loginWithGoogle, loginWithMicrosoft } from '../services/auth';

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const theme = useTheme();

  const onSubmit = async () => {
    setBusy(true);
    setErr(null);
    setShowSignupPrompt(false);
    const res = await login(username.trim(), password);
    setBusy(false);
    if (res.success) {
      // Navigation is handled by auth state listener
    } else {
      setErr(res.error || 'Login failed');
    }
  };

  const handleGoogleLogin = async () => {
    setOauthBusy(true);
    setErr(null);
    setShowSignupPrompt(false);
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
    setShowSignupPrompt(false);
    const res = await loginWithMicrosoft();
    setOauthBusy(false);
    if (!res.success) {
      // Check if it's the "account not found" error
      if (res.error?.includes('Please sign up with Microsoft first')) {
        setShowSignupPrompt(true);
      }
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
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Image 
            source={require('../assets/sapaa-full-black.png')} 
            style={{ width: 300, height: 132, resizeMode: 'contain' }} 
          />
        </View>
        <Text variant="headlineLarge" style={{ marginBottom: 8, fontWeight: 'bold', color: theme.colors.onBackground }}>
          Welcome Back
        </Text>
        <Text variant="bodyMedium" style={{ marginBottom: 24, color: theme.colors.onSurfaceVariant }}>
          Sign in to continue
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
            or sign in with email
          </Text>
          <Divider style={styles.divider} />
        </View>

        {/* Email/Password Form */}
        <TextInput
          testID="login-username"
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={username}
          onChangeText={(t) => {
            setUsername(t);
            if (err) setErr(null);
            if (showSignupPrompt) setShowSignupPrompt(false);
          }}
          style={{ marginBottom: 12 }}
          mode="outlined"
        />

        <TextInput
          testID="login-password"
          label="Password"
          secureTextEntry
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (err) setErr(null);
            if (showSignupPrompt) setShowSignupPrompt(false);
          }}
          style={{ marginBottom: 12 }}
          mode="outlined"
        />

        {err && (
          <View style={styles.errorContainer}>
            <Text testID="login-error" style={[styles.errorText, { color: theme.colors.error }]}>
              {err}
            </Text>
            {showSignupPrompt && (
              <Button
                mode="text"
                onPress={() => navigation.navigate('Signup')}
                style={styles.signupPromptButton}
                compact
              >
                Go to Sign Up
              </Button>
            )}
          </View>
        )}

        <Button
          testID="login-continue"
          mode="contained"
          onPress={onSubmit}
          loading={busy}
          disabled={busy || oauthBusy}
          style={{ marginBottom: 16 }}
        >
          Sign In
        </Button>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>Don't have an account? </Text>
          <Button mode="text" onPress={() => navigation.navigate('Signup')} compact>
            Sign Up
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
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
  signupPromptButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
});