import { getAuthHeader } from '../auth/getAuthHeader';
import { getJson } from '../api/http';
import { requireApiBaseUrl } from './_serviceUtils';
import type { Infractor } from '../features/infractores/types';

export async function findInfractorByDni(dni: string, token: string | null): Promise<Infractor> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  return getJson<Infractor>(baseUrl, `/infractor/${encodeURIComponent(dni)}`, { headers });
}

export async function findPropietarioByDni(dni: string, token: string | null): Promise<Infractor> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  return getJson<Infractor>(baseUrl, `/propietario/${encodeURIComponent(dni)}`, { headers });
}


