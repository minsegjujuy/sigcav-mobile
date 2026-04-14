import React, { createContext, useContext, useMemo, useState } from 'react';
import { getApiBaseUrl, getMissingApiBaseUrlMessage } from '../config/env';
import { login } from '../api/auth';

type AuthContextValue = {
  jwt: string | null;
  authenticate: (username: string, password: string) => Promise<string>;
  signIn: (username: string, password: string) => Promise<void>;
  signInWithJwt: (jwt: string) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [jwt, setJwt] = useState<string | null>(null);

  const value = useMemo<AuthContextValue>(
    () => {
      const authenticate = async (username: string, password: string) => {
        const baseUrl = getApiBaseUrl();
        if (!baseUrl) throw new Error(getMissingApiBaseUrlMessage());
        const res = await login(baseUrl, { username, password });
        return res.jwt;
      };

      return {
        jwt,
        authenticate,
        signIn: async (username: string, password: string) => {
          const token = await authenticate(username, password);
          setJwt(token.trim());
        },
        signInWithJwt: (token: string) => setJwt(token.trim()),
        signOut: () => setJwt(null),
      };
    },
    [jwt]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
