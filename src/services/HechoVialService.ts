import { getAuthHeader } from '../auth/getAuthHeader';
import { getJson, postJsonText } from '../api/http';
import type { HechoVialForm, HechoVialListDto } from '../features/hechos-viales/types';
import type { PageResponse } from '../features/common/PageResponse';
import buildUrl from '../utils/buildUrl';
import { requireApiBaseUrl } from './_serviceUtils';


export async function listarHechosViales(
  params: {
    page: number;
    size: number;
    fechaInicio?: string;
    fechaFin?: string;
    grupoId?: string;
    danosMateriales?: string;
    victimaFatal?: string;
    soloLesionados?: boolean;
  },
  token: string | null
): Promise<PageResponse<HechoVialListDto>> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  const url = buildUrl(`${baseUrl}/hechos-viales`, params);
  return getJson<PageResponse<HechoVialListDto>>(baseUrl, url, { headers });
}

export async function guardarHechoVial(
  hv: HechoVialForm,
  token: string | null
): Promise<void> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);

  await postJsonText(baseUrl, '/hechos-viales', hv, { headers });
}

// Alias por compatibilidad con el nombre usado en backend / snippets previos
export const guardarhechoVial = guardarHechoVial;

export async function deleteHechoVial(id: number, token: string | null): Promise<void> {
  const baseUrl = requireApiBaseUrl().replace(/\/+$/, '');
  const { headers } = getAuthHeader(token);
  const res = await fetch(`${baseUrl}/hechos-viales/${encodeURIComponent(String(id))}/status`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      ...(headers ?? {}),
    },
    body: null,
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw new Error(`PATCH hechos-viales/${id}/status -> HTTP ${res.status}. ${bodyText}`.trim());
  }
}
