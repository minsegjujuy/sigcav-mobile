import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getApiBaseUrl, getMissingApiBaseUrlMessage } from '../config/env';
import { login } from '../api/auth';
import type { AuthenticationResponse } from '../features/auth/types';
import { clearAuthSession, hydrateAuthSession, setAuthSession, subscribeAuthSession } from './authSession';

type AuthContextValue = {
  jwt: string | null;
  refreshToken: string | null;
  authenticate: (username: string, password: string) => Promise<AuthenticationResponse>;
  signIn: (username: string, password: string) => Promise<void>;
  signInWithJwt: (jwt: string, refreshToken?: string | null) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [jwt, setJwt] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    void hydrateAuthSession();
    return subscribeAuthSession((session) => {
      setJwt(session.jwt);
      setRefreshToken(session.refreshToken);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => {
      const authenticate = async (username: string, password: string) => {
        const baseUrl = getApiBaseUrl();
        if (!baseUrl) throw new Error(getMissingApiBaseUrlMessage());
        return await login(baseUrl, { username, password });
      };

      return {
        jwt,
        refreshToken,
        authenticate,
        signIn: async (username: string, password: string) => {
          const token = await authenticate(username, password);
          const jwtMaybe = (token as any)?.jwt as string | null | undefined;
          const refreshTokenMaybe = (token as any)?.refreshToken as string | null | undefined;
          if (!jwtMaybe) {
            throw new Error('Se requiere verificaciÃ³n de dos factores para completar el inicio de sesiÃ³n.');
          }
          await setAuthSession(jwtMaybe, refreshTokenMaybe ?? null);
        },
        signInWithJwt: (token: string, nextRefreshToken?: string | null) => {
          void setAuthSession(token, nextRefreshToken ?? refreshToken);
        },
        signOut: () => {
          void clearAuthSession();
        },
      };
    },
    [jwt, refreshToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
