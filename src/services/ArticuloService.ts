import { getAuthHeader } from '../auth/getAuthHeader';
import { getJson } from '../api/http';
import type { Articulo } from '../features/catalog/types';
import { requireApiBaseUrl } from './_serviceUtils';

export async function getArticulosByLey(leyId: number, token: string | null): Promise<Articulo[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  return getJson<Articulo[]>(baseUrl, `/articulo/ley/${leyId}`, { headers });
}

export async function getArticulos(token: string | null): Promise<Articulo[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  return getJson<Articulo[]>(baseUrl, '/articulo/', { headers });
}

