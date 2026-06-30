import { getJson } from "../api/http";
import { getAuthHeader } from "../auth/getAuthHeader";
import { LicenciaRequest } from "../features/actas/types";
import { requireApiBaseUrl } from "./_serviceUtils";

export async function obtenerLicenciasPorNro(nro: string, token : string | null): Promise<LicenciaRequest[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  const url = `${baseUrl}/licencias/${nro}`
  return getJson<LicenciaRequest[]>(baseUrl, url, { headers });
}

export async function obtenerLicenciaPorNro(nro: string, token: string | null): Promise<LicenciaRequest[]> {
  return obtenerLicenciasPorNro(nro, token);
}
