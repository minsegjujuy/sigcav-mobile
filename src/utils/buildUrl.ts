export default function buildUrl(baseUrl: string, params: Record<string, unknown>): string {
  const queryParts: string[] = [];

  for (const [key, rawValue] of Object.entries(params ?? {})) {
    if (rawValue === null || rawValue === undefined) continue;

    if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        if (item === null || item === undefined) continue;
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
      }
      continue;
    }

    queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(rawValue))}`);
  }

  if (queryParts.length === 0) return baseUrl;
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${queryParts.join('&')}`;
}

