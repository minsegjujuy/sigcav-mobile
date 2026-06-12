import { refreshAuthSession } from './authSession';

let isInstalled = false;
let isRefreshing = false;

function getUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function isAuthEndpoint(url: string): boolean {
  return /\/auth\/(login|2fa\/verify|2fa\/resend|refresh-mobile|setup)/i.test(url);
}

function setAuthorizationHeader(headers: HeadersInit | undefined, jwt: string): HeadersInit {
  const nextHeaders = new Headers(headers ?? undefined);
  nextHeaders.set('Authorization', `Bearer ${jwt}`);
  return nextHeaders;
}

export function installAuthRefreshInterceptor(): void {
  if (isInstalled) return;
  isInstalled = true;

  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = getUrl(input);
    const response = await originalFetch(input as any, init as any);

    if (response.status !== 401 || isAuthEndpoint(url) || isRefreshing) {
      return response;
    }

    isRefreshing = true;
    try {
      const refreshedJwt = await refreshAuthSession();
      if (!refreshedJwt) {
        return response;
      }

      const retryInit: RequestInit = {
        ...init,
        headers: setAuthorizationHeader(init?.headers, refreshedJwt),
      };

      return await originalFetch(input as any, retryInit as any);
    } finally {
      isRefreshing = false;
    }
  };
}
