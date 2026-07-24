import { getAuthHeader } from '../auth/getAuthHeader';
import { getJson } from '../api/http';
import { requireApiBaseUrl } from './_serviceUtils';

export interface Juzgado {
  id?: number;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
}

export async function obtenerJuzgados(token: string | null): Promise<Juzgado[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  return getJson<Juzgado[]>(baseUrl, '/juzgados', { headers });
}

export async function obtenerJuzgadosParaActas(token: string | null): Promise<Juzgado[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  return getJson<Juzgado[]>(baseUrl, '/juzgados/actas', { headers });
}

