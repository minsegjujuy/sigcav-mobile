const ENV_API_URL_KEY = 'EXPO_PUBLIC_API_URL';

export function getApiBaseUrl(): string | null {
  const raw = process?.env?.[ENV_API_URL_KEY];
  if (!raw) return null;
  const normalized = raw.trim().replace(/\/+$/, '');
  if (/\/api$/i.test(normalized)) return normalized;
  return `${normalized}/api`;
}

export function getMissingApiBaseUrlMessage(): string {
  return `Falta configurar ${ENV_API_URL_KEY} (por ejemplo en .env)`;
}
