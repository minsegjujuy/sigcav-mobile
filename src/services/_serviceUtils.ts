import { getApiBaseUrl, getMissingApiBaseUrlMessage } from '../config/env';

export function requireApiBaseUrl(): string {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new Error(getMissingApiBaseUrlMessage());
  return baseUrl;
}

