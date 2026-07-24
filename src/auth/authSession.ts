import { requireApiBaseUrl } from '../services/_serviceUtils';
import type { AuthenticationResponse } from '../features/auth/types';
import { clearJwt, loadJwt, saveJwt } from './secureJwtStorage';
import { clearRefreshToken, loadRefreshToken, saveRefreshToken } from './secureRefreshTokenStorage';
import { refreshMobile } from '../services/AuthService';

export type AuthSession = {
  jwt: string | null;
  refreshToken: string | null;
};

type AuthSessionListener = (session: AuthSession) => void;

let currentSession: AuthSession = {
  jwt: null,
  refreshToken: null,
};

const listeners = new Set<AuthSessionListener>();

function emitSession(): void {
  for (const listener of listeners) {
    listener(currentSession);
  }
}

export function getAuthSession(): AuthSession {
  return currentSession;
}

export function subscribeAuthSession(listener: AuthSessionListener): () => void {
  listeners.add(listener);
  listener(currentSession);
  return () => {
    listeners.delete(listener);
  };
}

export async function hydrateAuthSession(): Promise<AuthSession> {
  const [jwt, refreshToken] = await Promise.all([loadJwt(), loadRefreshToken()]);
  currentSession = {
    jwt: jwt?.trim() ? jwt.trim() : null,
    refreshToken: refreshToken?.trim() ? refreshToken.trim() : null,
  };
  emitSession();
  return currentSession;
}

export async function setAuthSession(jwt: string | null, refreshToken: string | null): Promise<void> {
  currentSession = {
    jwt: jwt?.trim() ? jwt.trim() : null,
    refreshToken: refreshToken?.trim() ? refreshToken.trim() : null,
  };

  if (currentSession.jwt) {
    await saveJwt(currentSession.jwt);
  } else {
    await clearJwt();
  }

  if (currentSession.refreshToken) {
    await saveRefreshToken(currentSession.refreshToken);
  } else {
    await clearRefreshToken();
  }

  emitSession();
}

export async function clearAuthSession(): Promise<void> {
  currentSession = { jwt: null, refreshToken: null };
  await Promise.all([clearJwt(), clearRefreshToken()]);
  emitSession();
}

export async function refreshAuthSession(): Promise<string | null> {
  const refreshToken = currentSession.refreshToken?.trim() || (await loadRefreshToken())?.trim() || '';
  
  if (!refreshToken) {
    return null;
  }

  //const baseUrl = requireApiBaseUrl();
  const response = await refreshMobile({refreshToken});
  
  if (!response) {
    await clearAuthSession();
    return null;
  }

  const data = (await response) as AuthenticationResponse;
  const nextJwt = (data?.jwt ?? '').trim();
  const nextRefreshToken = (data?.refreshToken ?? '').trim();
  if (!nextJwt || !nextRefreshToken) {
    await clearAuthSession();
    return null;
  }

  await setAuthSession(nextJwt, nextRefreshToken);
  return nextJwt;
}
