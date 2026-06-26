import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { decodeJwtPayload } from '../auth/jwt';
import { isHttpDebugEnabled } from '../api/httpDebug';
import { verify as verify2fa } from '../services/AuthService';

export function LoginScreen() {
  const { authenticate, signInWithJwt } = useAuth();
  const { handleBiometricLogin, handleEnrollment } = useBiometricAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [twoFactorDigits, setTwoFactorDigits] = useState<string[]>(() => ['', '', '', '', '', '']);
  const [twoFactorMessage, setTwoFactorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBioSubmitting, setIsBioSubmitting] = useState(false);
  const [isTwoFactorSubmitting, setIsTwoFactorSubmitting] = useState(false);
  //const [error, setError] = useState<string | null>(null);
  const [bioEnabled, setBioEnabled] = useState(false);
  const otpRefs = useRef<Array<TextInput | null>>([]);

  /*useEffect(() => {
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
  }, []);*/

  async function onSubmit() {
    //setError(null);
    setIsSubmitting(true);
    try {
      const normalizedUsername = username.trim();
      const res = await authenticate(normalizedUsername, password);
      const jwt = (res as any)?.jwt as string | null | undefined;
      const refreshToken = (res as any)?.refreshToken as string | null | undefined;

      if (!jwt) {
        setChallengeId((res as any)?.challengeId ? String((res as any).challengeId) : null);
        setTwoFactorMessage((res as any)?.message ? String((res as any).message) : null);
        setTwoFactorDigits(['', '', '', '', '', '']);
        return;
      }

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
                signInWithJwt(jwt, refreshToken);
              })();
            },
          },
          {
            text: 'Activar',
            onPress: () => {
              void (async () => {
                await handleEnrollment(normalizedUsername, jwt);
                setBioEnabled(true);
                signInWithJwt(jwt, refreshToken);
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

  const awaitingTwoFactor = !!(challengeId ?? '').trim();

  const twoFactorCode = useMemo(() => twoFactorDigits.join(''), [twoFactorDigits]);

  useEffect(() => {
    if (!awaitingTwoFactor) return;
    const t = setTimeout(() => {
      otpRefs.current[0]?.focus?.();
    }, 150);
    return () => clearTimeout(t);
  }, [awaitingTwoFactor]);

  async function onVerifyTwoFactor() {
    const cid = (challengeId ?? '').trim();
    const code = (twoFactorCode ?? '').replace(/\D/g, '').slice(0, 6);

    if (!cid) return;
    if (code.length !== 6) return;

    setIsTwoFactorSubmitting(true);
    try {
      const res = await verify2fa({ challengeId: cid, code });
      const jwt = (res as any)?.jwt as string | null | undefined;
      const refreshToken = (res as any)?.refreshToken as string | null | undefined;
      if (!jwt) {
        setTwoFactorMessage((res as any)?.message ? String((res as any).message) : 'Código inválido.');
        return;
      }

      if (isHttpDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.log('[AUTH] 2fa jwt payload', decodeJwtPayload(jwt));
      }

      setChallengeId(null);
      setTwoFactorMessage(null);
      setTwoFactorDigits(['', '', '', '', '', '']);

      const normalizedUsername = username.trim();

      Alert.alert(
        'Ingreso OK',
        'Queres activar el ingreso con huella/cara para el login diario?',
        [
          {
            text: 'Ahora no',
            style: 'cancel',
            onPress: () => {
              void (async () => {
                signInWithJwt(jwt, refreshToken);
              })();
            },
          },
          {
            text: 'Activar',
            onPress: () => {
              void (async () => {
                await handleEnrollment(normalizedUsername, jwt);
                setBioEnabled(true);
                signInWithJwt(jwt, refreshToken);
              })();
            },
          },
        ]
      );
    } finally {
      setIsTwoFactorSubmitting(false);
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
    !awaitingTwoFactor &&
    username.trim().length > 0 &&
    password.length > 0 &&
    !isSubmitting &&
    !isBioSubmitting &&
    !isTwoFactorSubmitting;

  const canVerifyTwoFactor =
    awaitingTwoFactor &&
    (twoFactorCode ?? '').replace(/\D/g, '').length === 6 &&
    !isSubmitting &&
    !isBioSubmitting &&
    !isTwoFactorSubmitting;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Ingresar</Text>
        <Text style={styles.subtitle}>Accedé con tu usuario y contraseña</Text>

        {!awaitingTwoFactor ? (
          <>
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
          </>
        ) : (
          <>
            <Text style={styles.label}>Código de verificación (6 dí­gitos)</Text>
            <View style={styles.otpRow}>
              {Array.from({ length: 6 }).map((_, idx) => (
                <TextInput
                  key={idx}
                  ref={(r) => {
                    otpRefs.current[idx] = r;
                  }}
                  value={twoFactorDigits[idx] ?? ''}
                  onChangeText={(t) => {
                    const digits = (t ?? '').replace(/\D/g, '');

                    // Paste de cÃ³digo completo
                    if (digits.length > 1) {
                      const padded = digits.slice(0, 6).padEnd(6, ' ');
                      const next = padded.split('').map((c) => (c === ' ' ? '' : c));
                      setTwoFactorDigits(next);
                      if (digits.slice(0, 6).length === 6) {
                        otpRefs.current[5]?.focus?.();
                      } else {
                        otpRefs.current[Math.min(digits.length, 5)]?.focus?.();
                      }
                      return;
                    }

                    const nextDigit = digits.slice(0, 1);
                    setTwoFactorDigits((prev) => {
                      const next = [...prev];
                      next[idx] = nextDigit;
                      return next;
                    });

                    if (nextDigit && idx < 5) {
                      otpRefs.current[idx + 1]?.focus?.();
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.nativeEvent.key !== 'Backspace') return;
                    const current = twoFactorDigits[idx] ?? '';
                    if (current) {
                      setTwoFactorDigits((prev) => {
                        const next = [...prev];
                        next[idx] = '';
                        return next;
                      });
                      return;
                    }
                    if (idx > 0) {
                      otpRefs.current[idx - 1]?.focus?.();
                      setTwoFactorDigits((prev) => {
                        const next = [...prev];
                        next[idx - 1] = '';
                        return next;
                      });
                    }
                  }}
                  keyboardType="numeric"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType={idx === 0 ? 'oneTimeCode' : 'none'}
                  maxLength={1}
                  editable={!isTwoFactorSubmitting}
                  style={styles.otpInput}
                  returnKeyType={idx === 5 ? 'done' : 'next'}
                  onSubmitEditing={() => {
                    if (idx < 5) otpRefs.current[idx + 1]?.focus?.();
                    else onVerifyTwoFactor();
                  }}
                />
              ))}
            </View>
            {twoFactorMessage ? <Text style={styles.subtitle}>{twoFactorMessage}</Text> : null}
          </>
        )}

        <View style={styles.actions}>
          {!awaitingTwoFactor ? (
            <>
              <AppButton
                title="Ingresar"
                icon="lock-open"
                onPress={onSubmit}
                disabled={!canSubmit}
                loading={isSubmitting}
              />
              <AppButton
                title="Ingresar con huella"
                icon="fingerprint"
                variant="secondary"
                onPress={onBiometricPress}
                disabled={isSubmitting || isBioSubmitting}
                loading={isBioSubmitting}
              />
            </>
          ) : (
            <>
              <AppButton
                title="Verificar"
                icon="check"
                onPress={onVerifyTwoFactor}
                disabled={!canVerifyTwoFactor}
                loading={isTwoFactorSubmitting}
              />
              <AppButton
                title="Volver"
                icon="arrow-back"
                variant="ghost"
                onPress={() => {
                  setChallengeId(null);
                  setTwoFactorDigits(['', '', '', '', '', '']);
                  setTwoFactorMessage(null);
                }}
                disabled={isTwoFactorSubmitting}
              />
            </>
          )}
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
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  otpInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '900',
    backgroundColor: Colors.white,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});
