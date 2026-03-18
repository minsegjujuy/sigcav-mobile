import { getAuthHeader } from '../auth/getAuthHeader';
import { getJson } from '../api/http';
import { requireApiBaseUrl } from './_serviceUtils';
import type { UnidadRegional } from '../features/ubicacion/types';

export async function obtenerUnidadesRegionalesPorDepartamento(
  departamento: string,
  token: string | null
): Promise<UnidadRegional[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  return getJson<UnidadRegional[]>(
    baseUrl,
    `/unidad-regional/por-departamento/${encodeURIComponent(departamento)}`,
    { headers }
  );
}

