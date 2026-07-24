import { getAuthHeader } from '../auth/getAuthHeader';
import { getJson } from '../api/http';
import { requireApiBaseUrl } from './_serviceUtils';

export interface Jerarquia {
  idJer: number;
  nombre: string;
}

export async function getJerarquias(token: string | null): Promise<Jerarquia[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  return getJson<Jerarquia[]>(baseUrl, '/jerarquia/', { headers });
}

