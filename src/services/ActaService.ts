import type { ActaRequest } from '../features/actas/types';
import type { PageResponse } from '../features/common/PageResponse';
import type {
  ActaGrupo,
  ActaResumenDto,
  ArticuloCantidad,
  DiasCantidad,
  GrupoInforme,
  ReporteActas,
  TipoInformeList,
} from '../features/actas/reportingTypes';
import { getAuthHeader } from '../auth/getAuthHeader';
import { getBlob, getJson, postJson, putJson } from '../api/http';
import buildUrl from '../utils/buildUrl';
import { requireApiBaseUrl } from './_serviceUtils';

export async function crearActa(acta: ActaRequest, token: string | null): Promise<ActaRequest> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  return postJson<ActaRequest, ActaRequest>(baseUrl, '/acta/nueva', acta, { headers });
}

export async function actualizarActa(acta: ActaRequest, token: string | null): Promise<ActaRequest> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  return putJson<ActaRequest, ActaRequest>(baseUrl, '/acta/', acta, { headers });
}

export async function getResumenActas(
  params: Record<string, unknown>,
  token: string | null
): Promise<PageResponse<ActaResumenDto>> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  const url = buildUrl(`${baseUrl}/acta/private`, params);
  return getJson<PageResponse<ActaResumenDto>>(baseUrl, url, { headers });
}

export async function getResumenActasPdf(params: Record<string, unknown>, token: string | null): Promise<Blob> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  const url = buildUrl(`${baseUrl}/acta/private/exportacion-pdf`, params);
  return getBlob(baseUrl, url, { headers });
}

export async function getResumenActasPersonal(
  params: Record<string, unknown>,
  token: string | null
): Promise<PageResponse<ActaResumenDto>> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  const url = buildUrl(`${baseUrl}/acta/private/user`, params);
  return getJson<PageResponse<ActaResumenDto>>(baseUrl, url, { headers });
}

export async function obtenerActasPorDia(fi: string, ff: string, token: string | null): Promise<DiasCantidad[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  const url = buildUrl(`${baseUrl}/acta/private/dias`, { fechaInicio: fi, fechaFin: ff });
  return getJson<DiasCantidad[]>(baseUrl, url, { headers });
}

export async function obtenerZpl(nro: string, token: string | null): Promise<string> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);

  const res = await fetch(`${baseUrl}/acta/${nro}/zpl`, {
    method: 'GET',
    headers: {
      Accept: 'text/plain',
      ...headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error ${res.status}: ${errorText}`);
  }

  return await res.text();
}

export async function descargarPdfActa(nro: string, token: string | null): Promise<Blob> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  return getBlob(baseUrl, `/acta/${encodeURIComponent(nro)}/pdf`, { headers });
}

export async function obtenerPorcentajeDeActasPorDia(
  fi: string,
  ff: string,
  token: string | null
): Promise<DiasCantidad[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  const url = buildUrl(`${baseUrl}/acta/private/dias-porcentaje`, { fechaInicio: fi, fechaFin: ff });
  return getJson<DiasCantidad[]>(baseUrl, url, { headers });
}

export async function obtenerActasPorArticulo(
  fi: string,
  ff: string,
  token: string | null
): Promise<ArticuloCantidad[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  const url = buildUrl(`${baseUrl}/acta/private/articulo`, { fechaInicio: fi, fechaFin: ff });
  return getJson<ArticuloCantidad[]>(baseUrl, url, { headers });
}

export async function obtenerActasPorGrupo(fi: string, ff: string, token: string | null): Promise<ActaGrupo[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  const url = buildUrl(`${baseUrl}/acta/private/por-grupo`, { fechaInicio: fi, fechaFin: ff });
  return getJson<ActaGrupo[]>(baseUrl, url, { headers });
}

export async function obtenerActasPorGrupoPorPuesto(
  fi: string,
  ff: string,
  token: string | null
): Promise<GrupoInforme[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  const url = buildUrl(`${baseUrl}/acta/private/grupos-por-puesto`, { fechaInicio: fi, fechaFin: ff });
  return getJson<GrupoInforme[]>(baseUrl, url, { headers });
}

export async function obtenerTipoDeActasPorPuesto(
  fi: string,
  ff: string,
  token: string | null
): Promise<TipoInformeList[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  const url = buildUrl(`${baseUrl}/acta/private/tipos-por-puesto`, { fechaInicio: fi, fechaFin: ff });
  return getJson<TipoInformeList[]>(baseUrl, url, { headers });
}

export async function obtenerActasPorNacionalidad(
  fi: string,
  ff: string,
  token: string | null
): Promise<ReporteActas[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  const url = buildUrl(`${baseUrl}/acta/private/cantidad-nacionalidad`, { fechaInicio: fi, fechaFin: ff });
  return getJson<ReporteActas[]>(baseUrl, url, { headers });
}

export async function obtenerActasPorMotivo(fi: string, ff: string, token: string | null): Promise<ReporteActas[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  const url = buildUrl(`${baseUrl}/acta/private/cantidad-motivo`, { fechaInicio: fi, fechaFin: ff });
  return getJson<ReporteActas[]>(baseUrl, url, { headers });
}

export async function obtenerActasPorProvincia(
  fi: string,
  ff: string,
  token: string | null
): Promise<ReporteActas[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  const url = buildUrl(`${baseUrl}/acta/private/cantidad-provincia`, { fechaInicio: fi, fechaFin: ff });
  return getJson<ReporteActas[]>(baseUrl, url, { headers });
}

export async function obtenerActasPorJerarquia(
  fi: string,
  ff: string,
  token: string | null
): Promise<ReporteActas[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  const url = buildUrl(`${baseUrl}/acta/private/cantidad-jerarquia`, { fechaInicio: fi, fechaFin: ff });
  return getJson<ReporteActas[]>(baseUrl, url, { headers });
}
