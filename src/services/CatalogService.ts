import { getJson } from "../api/http";
import { getAuthHeader } from "../auth/getAuthHeader";
import { Catalogos } from "../features/ubicacion/types";
import { requireApiBaseUrl } from "./_serviceUtils";

export async function getCatalogos(token: string | null): Promise<Catalogos> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  return getJson<Catalogos>(baseUrl, '/catalogos', { headers });
}
