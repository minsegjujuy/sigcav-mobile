import { getAuthHeader } from '../auth/getAuthHeader';
import { getJson } from '../api/http';
import type { Puesto } from '../features/catalog/types';
import { requireApiBaseUrl } from './_serviceUtils';

export async function getPuestos(token: string | null): Promise<Puesto[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  return getJson<Puesto[]>(baseUrl, '/puesto', { headers });
}

