const REFRESH_TOKEN_KEY = 'auth.refreshToken';

async function getSecureStore() {
  try {
    return await import('expo-secure-store');
  } catch {
    throw new Error('Falta instalar expo-secure-store para guardar el refresh token en almacenamiento seguro');
  }
}

export async function saveRefreshToken(refreshToken: string): Promise<void> {
  const SecureStore = await getSecureStore();
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function loadRefreshToken(): Promise<string | null> {
  const SecureStore = await getSecureStore();
  return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearRefreshToken(): Promise<void> {
  const SecureStore = await getSecureStore();
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
