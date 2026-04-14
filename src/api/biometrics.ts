import { HttpError, postJson, postJsonText } from './http';
import type { AuthenticationResponse } from '../features/auth/types';
import type { BiometricLoginDto, RegisterPublicKeyDto } from '../features/biometrics/types';

function pathWithOptionalApiPrefix(baseUrl: string, pathWithoutApiPrefix: string): string {
  const normalized = baseUrl.replace(/\/+$/, '');
  if (/\/api$/i.test(normalized)) return pathWithoutApiPrefix;
  return `/api${pathWithoutApiPrefix}`;
}

export async function registerPublicKey(
  baseUrl: string,
  request: RegisterPublicKeyDto,
  jwt?: string
): Promise<string | null> {
  // Backend: POST /api/usuario/register-key
  const path = pathWithOptionalApiPrefix(baseUrl, '/usuario/register-key');
  try {
    return await postJsonText<RegisterPublicKeyDto>(baseUrl, path, request, {
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined,
    });
  } catch (e) {
    if (e instanceof HttpError && e.status === 405) {
      throw new Error(
        `${e.message}. Si la URL parece incorrecta, revisa EXPO_PUBLIC_API_URL y reinicia Expo con cache clean.`
      );
    }
    throw e;
  }
}

export async function biometricLogin(
  baseUrl: string,
  request: BiometricLoginDto
): Promise<AuthenticationResponse> {
  // Backend: POST /api/auth/biometric-login
  const path = pathWithOptionalApiPrefix(baseUrl, '/auth/biometric-login');
  try {
    return await postJson<BiometricLoginDto, AuthenticationResponse>(baseUrl, path, request);
  } catch (e) {
    if (e instanceof HttpError && e.status === 405) {
      throw new Error(
        `${e.message}. Si la URL parece incorrecta, revisa EXPO_PUBLIC_API_URL y reinicia Expo con cache clean.`
      );
    }
    throw e;
  }
}
