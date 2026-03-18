import { getAuthHeader } from '../auth/getAuthHeader';
import { getJson } from '../api/http';
import type { Grupo } from '../features/catalog/types';
import { requireApiBaseUrl } from './_serviceUtils';

export async function getGrupos(token: string | null): Promise<Grupo[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  return getJson<Grupo[]>(baseUrl, '/grupo', { headers });
}

