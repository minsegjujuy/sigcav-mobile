export function getAuthHeader(token: string | null): { headers?: Record<string, string> } {
  const normalized = (token ?? '').trim();
  if (normalized) {
    return {
      headers: {
        Authorization: `Bearer ${normalized}`,
      },
    };
  }
  return {};
}
