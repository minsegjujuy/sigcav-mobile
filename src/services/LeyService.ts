import { getAuthHeader } from '../auth/getAuthHeader';
import { getJson } from '../api/http';
import type { Ley } from '../features/catalog/types';
import { requireApiBaseUrl } from './_serviceUtils';

export async function getLeyes(token: string | null): Promise<Ley[]> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);
  return getJson<Ley[]>(baseUrl, '/ley', { headers });
}

