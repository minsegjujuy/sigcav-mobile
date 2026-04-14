const BIOMETRIC_ENABLED_KEY = 'biometrics.is_enabled';
const BIOMETRIC_USERNAME_KEY = 'biometrics.username';

async function getAsyncStorage() {
  try {
    const mod = await import('@react-native-async-storage/async-storage');
    return mod.default;
  } catch {
    throw new Error(
      'Falta instalar @react-native-async-storage/async-storage para usar el login biometrico'
    );
  }
}

export async function setBiometricEnrollment(username: string): Promise<void> {
  const AsyncStorage = await getAsyncStorage();
  await AsyncStorage.multiSet([
    [BIOMETRIC_ENABLED_KEY, 'true'],
    [BIOMETRIC_USERNAME_KEY, username],
  ]);
}

export async function clearBiometricEnrollment(): Promise<void> {
  const AsyncStorage = await getAsyncStorage();
  await AsyncStorage.multiRemove([BIOMETRIC_ENABLED_KEY, BIOMETRIC_USERNAME_KEY]);
}

export async function isBiometricEnabled(): Promise<boolean> {
  const AsyncStorage = await getAsyncStorage();
  const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
  return enabled === 'true';
}

export async function getEnrolledUsername(): Promise<string | null> {
  const AsyncStorage = await getAsyncStorage();
  return await AsyncStorage.getItem(BIOMETRIC_USERNAME_KEY);
}
