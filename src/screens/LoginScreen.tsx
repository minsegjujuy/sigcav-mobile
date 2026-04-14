import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { HttpError } from '../api/http';
import { Colors } from '../theme/colors';
import { AppButton } from '../components/ui/AppButton';
import { isBiometricEnabled } from '../auth/biometricStorage';
import { useBiometricAuth } from '../auth/useBiometricAuth';
import { saveJwt } from '../auth/secureJwtStorage';
import { decodeJwtPayload } from '../auth/jwt';
import { isHttpDebugEnabled } from '../api/httpDebug';

export function LoginScreen() {
  const { authenticate, signInWithJwt } = useAuth();
  const { handleBiometricLogin, handleEnrollment } = useBiometricAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBioSubmitting, setIsBioSubmitting] = useState(false);
  //const [error, setError] = useState<string | null>(null);
  const [bioEnabled, setBioEnabled] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const enabled = await isBiometricEnabled();
        if (!alive) return;
        setBioEnabled(enabled);

        // Login diario: si la biometria esta activa, intentamos loguear automaticamente al abrir la pantalla.
        if (enabled) {
          setIsBioSubmitting(true);
          await handleBiometricLogin();
        }
      } catch {
        if (alive) setBioEnabled(false);
      } finally {
        if (alive) setIsBioSubmitting(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit() {
    //setError(null);
    setIsSubmitting(true);
    try {
      const normalizedUsername = username.trim();
      const jwt = await authenticate(normalizedUsername, password);

      if (isHttpDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.log('[AUTH] password jwt payload', decodeJwtPayload(jwt));
      }

      Alert.alert(
        'Ingreso OK',
        'Queres activar el ingreso con huella/cara para el login diario?',
        [
          {
            text: 'Ahora no',
            style: 'cancel',
            onPress: () => {
              void (async () => {
                await saveJwt(jwt);
                signInWithJwt(jwt);
              })();
            },
          },
          {
            text: 'Activar',
            onPress: () => {
              void (async () => {
                await handleEnrollment(normalizedUsername, jwt);
                setBioEnabled(true);
                await saveJwt(jwt);
                signInWithJwt(jwt);
              })();
            },
          },
        ]
      );
    } catch (e) {
      if (e instanceof HttpError) {
        //const bodyPreview = (e.bodyText ?? '').slice(0, 180);
        //setError(bodyPreview ? `${e.message}\n${bodyPreview}` : e.message);
        //setError(e.message);
      } else {
        //setError(e instanceof Error ? e.message : 'Error inesperado');
        console.log(e);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onBiometricPress() {
    //setError(null);
    setIsBioSubmitting(true);
    try {
      await handleBiometricLogin();
    } finally {
      setIsBioSubmitting(false);
    }
  }

  const canSubmit =
    username.trim().length > 0 && password.length > 0 && !isSubmitting && !isBioSubmitting;

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

        <View style={styles.actions}>
          <AppButton
            title="Ingresar"
            icon="lock-open"
            onPress={onSubmit}
            disabled={!canSubmit}
            loading={isSubmitting}
          />
          {bioEnabled ? (
            <AppButton
              title="Ingresar con huella"
              icon="fingerprint"
              variant="secondary"
              onPress={onBiometricPress}
              disabled={isSubmitting || isBioSubmitting}
              loading={isBioSubmitting}
            />
          ) : null}
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
