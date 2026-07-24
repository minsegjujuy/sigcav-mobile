import { getAuthHeader } from '../auth/getAuthHeader';
import { getJson } from '../api/http';
import type { Tipo } from '../features/catalog/types';
import { requireApiBaseUrl } from './_serviceUtils';

export async function getAllTipoActas(token: string | null): Promise<Tipo[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  return getJson<Tipo[]>(baseUrl, '/tipo-actas', { headers });
}

