import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { HttpError } from '../api/http';
import { Colors } from '../theme/colors';
import { AppButton } from '../components/ui/AppButton';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(username.trim(), password);
    } catch (e) {
      if (e instanceof HttpError) {
        const bodyPreview = (e.bodyText ?? '').slice(0, 180);
        setError(bodyPreview ? `${e.message}\n${bodyPreview}` : e.message);
      } else {
        setError(e instanceof Error ? e.message : 'Error inesperado');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = username.trim().length > 0 && password.length > 0 && !isSubmitting;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Ingresar</Text>
        <Text style={styles.subtitle}>Accedé con tu usuario y contraseña</Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          placeholder="usuario"
          placeholderTextColor={Colors.textSecondary}
          style={styles.input}
          editable={!isSubmitting}
          returnKeyType="next"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          placeholder="••••••••"
          placeholderTextColor={Colors.textSecondary}
          style={styles.input}
          editable={!isSubmitting}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          <AppButton
            title="Ingresar"
            icon="lock-open"
            onPress={onSubmit}
            disabled={!canSubmit}
            loading={isSubmitting}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  card: {
    gap: 10,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  title: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '900', color: Colors.textPrimary },
  input: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: Colors.white,
    color: Colors.textPrimary,
  },
  error: { color: Colors.danger, fontWeight: '800' },
  actions: { gap: 10, marginTop: 6 },
});
