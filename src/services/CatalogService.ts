import { getJson } from "../api/http";
import { getAuthHeader } from "../auth/getAuthHeader";
import { CatalogoNuevoDto, ModeloDto } from "../features/catalog/externos";
import { Catalogos } from "../features/ubicacion/types";
import { requireApiBaseUrl } from "./_serviceUtils";

export async function getCatalogos(token: string | null): Promise<Catalogos> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  return getJson<Catalogos>(baseUrl, '/catalogos', { headers });
}

export async function getCatalogosExternos(token: string | null): Promise<CatalogoNuevoDto> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  return getJson<CatalogoNuevoDto>(baseUrl, '/catalogos/nuevo', { headers });
}

export async function getCatalogosExternosModelos(token: string | null): Promise<ModeloDto[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  return getJson<ModeloDto[]>(baseUrl, '/catalogos/nuevo/modelos', { headers });
}
