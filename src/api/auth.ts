import { HttpError, postJson } from './http';
import type { AuthenticationRequest, AuthenticationResponse } from '../features/auth/types';

export async function login(
  baseUrl: string,
  request: AuthenticationRequest
): Promise<AuthenticationResponse> {
  const normalized = baseUrl.replace(/\/+$/, '');
  const path = /\/api$/i.test(normalized) ? '/auth/login' : '/api/auth/login';

  try {
    return await postJson<AuthenticationRequest, AuthenticationResponse>(baseUrl, path, request);
  } catch (e) {
    if (e instanceof HttpError && e.status === 405) {
      throw new Error(
        `${e.message}. Si la URL parece incorrecta, revisá EXPO_PUBLIC_API_URL y reiniciá Expo con cache clean.`
      );
    }
    throw e;
  }
}
