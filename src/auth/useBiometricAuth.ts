import { Alert } from 'react-native';

import { biometricLogin, registerPublicKey } from '../api/biometrics';
import { HttpError } from '../api/http';
import { requireApiBaseUrl } from '../services/_serviceUtils';
import {
  BiometricsCancelledError,
  BiometricsUnavailableError,
  generateSignature,
  setupBiometrics,
} from '../services/BiometricService';
import { setBiometricEnrollment, getEnrolledUsername } from './biometricStorage';
import { useAuth } from './AuthContext';
import { decodeJwtPayload } from './jwt';
import { isHttpDebugEnabled } from '../api/httpDebug';

function toPrettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function useBiometricAuth() {
  const { signInWithJwt, jwt } = useAuth();

  function pickEnrolledUsername(fallbackUsername: string, serverMessage: string | null): string {
    const msg = (serverMessage ?? '').trim();
    // Ej: "Llave pública registrada con éxito para el oficial: 14790"
    const match = msg.match(/oficial\s*:\s*(\d+)/i) ?? msg.match(/\b(\d{4,})\b/);
    const extracted = match?.[1]?.trim();
    return extracted && extracted.length > 0 ? extracted : fallbackUsername;
  }

  async function handleEnrollment(username: string, authJwt?: string): Promise<void> {
    const normalizedUsername = username.trim();
    if (!normalizedUsername) {
      Alert.alert('Error', 'Ingresá un username válido');
      return;
    }

    try {
      const publicKey = await setupBiometrics();

      // Enrolamiento: pedimos biometría una vez para confirmar que el usuario puede usar su huella/cara
      // y que la llave privada quedó protegida correctamente en el dispositivo.
      await generateSignature(normalizedUsername);

      const baseUrl = requireApiBaseUrl();
      const serverMessage = await registerPublicKey(
        baseUrl,
        { username: normalizedUsername, publicKey },
        authJwt ?? jwt ?? undefined
      );

      const enrolledUsername = pickEnrolledUsername(normalizedUsername, serverMessage);
      await setBiometricEnrollment(enrolledUsername);

      Alert.alert('Listo', serverMessage?.trim() || 'Biometría activada para este usuario');
    } catch (e) {
      if (e instanceof BiometricsCancelledError) {
        // No hacemos nada si el usuario cancela el prompt biometrico.
        return;
      }
      if (e instanceof BiometricsUnavailableError) {
        Alert.alert('Biometría no disponible', e.message);
        return;
      }
      if (e instanceof HttpError && e.status === 409) {
        Alert.alert(
          'Ya registrado',
          'Ya existe una llave registrada para este usuario. Si cambiaste de teléfono, pedí reset o usá deleteKeys() y re-enrolá.'
        );
        return;
      }
      if (e instanceof HttpError && e.debug) {
        Alert.alert('HTTP Error (debug)', `${e.message}\n\n${toPrettyJson(e.debug)}`);
        return;
      }

      const message = e instanceof Error ? e.message : 'Error inesperado';
      Alert.alert('Error', message);
    }
  }

  async function handleBiometricLogin(): Promise<void> {
    try {
      const username = await getEnrolledUsername();
      if (!username) {
        Alert.alert('Error', 'No hay un usuario enrolado para biometría en este dispositivo');
        return;
      }

      // generateSignature firma exactamente el `originalMessage` (timestamp) que se envía al backend.
      const dto = await generateSignature(username);
      // eslint-disable-next-line no-console
      console.log('[BIOMETRICS] login dto', { username: dto.username, originalMessage: dto.originalMessage });

      const baseUrl = requireApiBaseUrl();
      const res = await biometricLogin(baseUrl, dto);

      if (isHttpDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.log('[AUTH] biometric jwt payload', decodeJwtPayload(res.jwt));
      }

      // En esta app, "navegar" equivale a setear el JWT en el AuthContext (Root cambia a Home).
      signInWithJwt(res.jwt, res.refreshToken);
    } catch (e) {
      if (e instanceof BiometricsCancelledError) {
        // No hacemos nada si el usuario cancela el prompt biometrico.
        return;
      }
      if (e instanceof BiometricsUnavailableError) {
        Alert.alert('Biometría no disponible', e.message);
        return;
      }
      if (e instanceof HttpError) {
        const bodyPreview = (e.bodyText ?? '').slice(0, 180);
        if (e.debug) {
          Alert.alert('HTTP Error (debug)', `${e.message}\n\n${toPrettyJson(e.debug)}`);
        } else {
          Alert.alert('Error de red', bodyPreview ? `${e.message}\n${bodyPreview}` : e.message);
        }
        return;
      }

      const message = e instanceof Error ? e.message : 'Error inesperado';
      Alert.alert('Error', message);
    }
  }

  return { handleEnrollment, handleBiometricLogin };
}
