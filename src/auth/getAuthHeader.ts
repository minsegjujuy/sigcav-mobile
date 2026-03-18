export function getAuthHeader(token: string | null): { headers?: Record<string, string> } {
  if (token) {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }
  return {};
}

