import Constants from 'expo-constants';

/*export function getApiBaseUrl(): string | null {
  const raw = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL;

  if (!raw) return null;

  const normalized = raw.trim().replace(/\/+$/, '');
  return /\/api$/i.test(normalized) ? normalized : `${normalized}/api`;
}*/

export function getApiBaseUrl(): string | null {
  const raw = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL;
  console.log("API DESDE EXTRA:", Constants.expoConfig?.extra);

  if (!raw) return null;

  const normalized = raw.trim().replace(/\/+$/, '');
  return /\/api$/i.test(normalized) ? normalized : `${normalized}/api`;
}

export function getMissingApiBaseUrlMessage(): string {
  return 'Falta configurar EXPO_PUBLIC_API_URL (por ejemplo en .env)';
}