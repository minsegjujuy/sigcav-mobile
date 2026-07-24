const JWT_KEY = 'auth.jwt';

async function getSecureStore() {
  try {
    return await import('expo-secure-store');
  } catch {
    throw new Error('Falta instalar expo-secure-store para guardar el JWT en almacenamiento seguro');
  }
}

export async function saveJwt(jwt: string): Promise<void> {
  const SecureStore = await getSecureStore();
  await SecureStore.setItemAsync(JWT_KEY, jwt);
}

export async function loadJwt(): Promise<string | null> {
  const SecureStore = await getSecureStore();
  return await SecureStore.getItemAsync(JWT_KEY);
}

export async function clearJwt(): Promise<void> {
  const SecureStore = await getSecureStore();
  await SecureStore.deleteItemAsync(JWT_KEY);
}
