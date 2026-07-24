import { getValidationError } from '../utils/getValidationError';
import { SnackbarUtilities } from '../utils/snackbar/SnackbarUtilities';

export class HttpError extends Error {
  readonly status: number;
  readonly bodyText: string | null;
  readonly debug?: unknown;

  constructor(message: string, status: number, bodyText: string | null, debug?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.bodyText = bodyText;
    this.debug = debug;
  }
}

function joinUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return headers as Record<string, string>;
}

function headersToRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function tryExtractBackendMessage(bodyText: string | null): string | null {
  const raw = (bodyText ?? '').trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as any;
    const message = parsed?.message;
    return typeof message === 'string' && message.trim() ? message.trim() : null;
  } catch {
    return null;
  }
}

function notifyHttpError(status: number, bodyText: string | null) {
  const backendMessage = tryExtractBackendMessage(bodyText);
  if (status === 400 || status === 409) {
    SnackbarUtilities.error(backendMessage ?? 'interceptado');
    return;
  }

  const mapped = getValidationError(status);
  SnackbarUtilities.info(mapped ?? backendMessage ?? `Error HTTP ${status}.`);
}

export async function getJson<TResponse>(
  baseUrl: string,
  pathOrAbsoluteUrl: string,
  init?: Omit<RequestInit, 'method' | 'body'>
): Promise<TResponse> {
  const start = Date.now();
  const url = isAbsoluteUrl(pathOrAbsoluteUrl)
    ? pathOrAbsoluteUrl
    : joinUrl(baseUrl, pathOrAbsoluteUrl);

  const reqHeaders = {
    Accept: 'application/json',
    ...normalizeHeaders(init?.headers),
  };

  const res = await fetch(url, {
    ...init,
    method: 'GET',
    headers: reqHeaders,
  });

  if (!res.ok) {
    const bodyText = await safeReadText(res);
    notifyHttpError(res.status, bodyText);
    let debug: unknown = undefined;
    try {
      const { isHttpDebugEnabled, redactHeaders } = await import('./httpDebug');
      if (isHttpDebugEnabled()) {
        debug = {
          method: 'GET',
          url,
          tookMs: Date.now() - start,
          request: { headers: redactHeaders(reqHeaders) },
          response: {
            status: res.status,
            statusText: res.statusText,
            headers: redactHeaders(headersToRecord(res.headers)),
            bodyText,
          },
        };
        // eslint-disable-next-line no-console
        console.log('[HTTP][ERROR]', debug);
      }
    } catch {
      // ignore debug logger errors
    }
    throw new HttpError(`GET ${url} -> HTTP ${res.status} ${res.statusText}`, res.status, bodyText, debug);
  }

  return await parseJsonResponse<TResponse>(res, url);
}
export async function postJson<TRequest extends object, TResponse>(
  baseUrl: string,
  path: string,
  body: TRequest,
  init?: Omit<RequestInit, 'method' | 'body'>
): Promise<TResponse> {
  const start = Date.now();
  const url = joinUrl(baseUrl, path);
  const reqHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...normalizeHeaders(init?.headers),
  };
  const reqBodyText = JSON.stringify(body);

  const res = await fetch(url, {
    ...init,
    method: 'POST',
    headers: reqHeaders,
    body: reqBodyText,
  });

  if (!res.ok) {
    const bodyText = await safeReadText(res);
    notifyHttpError(res.status, bodyText);

    let debug: unknown = undefined;
    try {
      const { isHttpDebugEnabled, redactHeaders, redactJsonBody } = await import('./httpDebug');
      if (isHttpDebugEnabled()) {
        debug = {
          method: 'POST',
          url,
          tookMs: Date.now() - start,
          request: {
            headers: redactHeaders(reqHeaders),
            body: redactJsonBody(body),
            bodyText: reqBodyText,
          },
          response: {
            status: res.status,
            statusText: res.statusText,
            headers: redactHeaders(headersToRecord(res.headers)),
            bodyText,
          },
        };

        console.log('[HTTP][ERROR]', debug);
      }
    } catch {
      // ignore debug logger errors
    }

    throw new HttpError(
      `POST ${url} -> HTTP ${res.status} ${res.statusText}`,
      res.status,
      bodyText,
      debug
    );
  }

  return await parseJsonResponse<TResponse>(res, url);
}
/*export async function postJson<TRequest extends object, TResponse>(
  baseUrl: string,
  path: string,
  body: TRequest,
  init?: Omit<RequestInit, 'method' | 'body'>
): Promise<TResponse> {
  const start = Date.now();
  const url = joinUrl(baseUrl, path);
  const reqHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...normalizeHeaders(init?.headers),
  };
  const reqBodyText = JSON.stringify(body);
  const res = await fetch(url, {
    ...init,
    method: 'POST',
    headers: reqHeaders,
    body: reqBodyText,
  });

  if (!res.ok) {
    const bodyText = await safeReadText(res);
    notifyHttpError(res.status, bodyText);
    let debug: unknown = undefined;
    try {
      const { isHttpDebugEnabled, redactHeaders, redactJsonBody } = await import('./httpDebug');
      if (isHttpDebugEnabled()) {
        debug = {
          method: 'POST',
          url,
          tookMs: Date.now() - start,
          request: {
            headers: redactHeaders(reqHeaders),
            body: redactJsonBody(body),
            bodyText: reqBodyText,
          },
          response: {
            status: res.status,
            statusText: res.statusText,
            headers: redactHeaders(headersToRecord(res.headers)),
            bodyText,
          },
        };

        // Logs completos (request/response) para depurar 400/401/403/500 en backend.
        // Nota: se redactan Authorization/password/signature/publicKey.
        // eslint-disable-next-line no-console
        console.log('[HTTP][ERROR]', debug);
      }
    } catch {
      // ignore debug logger errors
    }
    throw new HttpError(
      `POST ${url} -> HTTP ${res.status} ${res.statusText}`,
      res.status,
      bodyText,
      debug
    );
  }

  return await parseJsonResponse<TResponse>(res, url);
}*/

/**
 * Igual que `postJson`, pero NO intenta parsear JSON en la respuesta.
 * Util cuando el backend devuelve 200 con texto plano (por ejemplo: "Llave registrada OK").
 */
export async function postJsonVoid<TRequest extends object>(
  baseUrl: string,
  path: string,
  body: TRequest,
  init?: Omit<RequestInit, 'method' | 'body'>
): Promise<void> {
  const start = Date.now();
  const url = joinUrl(baseUrl, path);
  const reqHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...normalizeHeaders(init?.headers),
  };
  const reqBodyText = JSON.stringify(body);

  const res = await fetch(url, {
    ...init,
    method: 'POST',
    headers: reqHeaders,
    body: reqBodyText,
  });

  if (!res.ok) {
    const bodyText = await safeReadText(res);
    notifyHttpError(res.status, bodyText);
    let debug: unknown = undefined;
    try {
      const { isHttpDebugEnabled, redactHeaders, redactJsonBody } = await import('./httpDebug');
      if (isHttpDebugEnabled()) {
        debug = {
          method: 'POST',
          url,
          tookMs: Date.now() - start,
          request: {
            headers: redactHeaders(reqHeaders),
            body: redactJsonBody(body),
            bodyText: reqBodyText,
          },
          response: {
            status: res.status,
            statusText: res.statusText,
            headers: redactHeaders(headersToRecord(res.headers)),
            bodyText,
          },
        };
        // eslint-disable-next-line no-console
        console.log('[HTTP][ERROR]', debug);
      }
    } catch {
      // ignore debug logger errors
    }
    throw new HttpError(
      `POST ${url} -> HTTP ${res.status} ${res.statusText}`,
      res.status,
      bodyText,
      debug
    );
  }

  // En modo debug, igual mostramos el status y el body (texto) por si ayuda a depurar.
  try {
    const { isHttpDebugEnabled, redactHeaders } = await import('./httpDebug');
    if (isHttpDebugEnabled()) {
      const responseText = await safeReadText(res);
      // eslint-disable-next-line no-console
      console.log('[HTTP][OK]', {
        method: 'POST',
        url,
        tookMs: Date.now() - start,
        request: { headers: redactHeaders(reqHeaders), bodyText: reqBodyText },
        response: {
          status: res.status,
          statusText: res.statusText,
          headers: redactHeaders(headersToRecord(res.headers)),
          bodyText: responseText,
        },
      });
    }
  } catch {
    // ignore debug logger errors
  }
}

/**
 * POST JSON y devuelve el body como texto (o null si no se puede leer).
 * Util cuando el backend responde 200 con mensaje de texto plano.
 */
export async function postJsonText<TRequest extends object>(
  baseUrl: string,
  path: string,
  body: TRequest,
  init?: Omit<RequestInit, 'method' | 'body'>
): Promise<string | null> {
  const start = Date.now();
  const url = joinUrl(baseUrl, path);
  const reqHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...normalizeHeaders(init?.headers),
  };
  const reqBodyText = JSON.stringify(body);

  const res = await fetch(url, {
    ...init,
    method: 'POST',
    headers: reqHeaders,
    body: reqBodyText,
  });

  const responseText = await safeReadText(res);

  if (!res.ok) {
    notifyHttpError(res.status, responseText);
    let debug: unknown = undefined;
    try {
      const { isHttpDebugEnabled, redactHeaders, redactJsonBody } = await import('./httpDebug');
      if (isHttpDebugEnabled()) {
        debug = {
          method: 'POST',
          url,
          tookMs: Date.now() - start,
          request: {
            headers: redactHeaders(reqHeaders),
            body: redactJsonBody(body),
            bodyText: reqBodyText,
          },
          response: {
            status: res.status,
            statusText: res.statusText,
            headers: redactHeaders(headersToRecord(res.headers)),
            bodyText: responseText,
          },
        };
        // eslint-disable-next-line no-console
        console.log('[HTTP][ERROR]', debug);
      }
    } catch {
      // ignore debug logger errors
    }
    throw new HttpError(
      `POST ${url} -> HTTP ${res.status} ${res.statusText}`,
      res.status,
      responseText,
      debug
    );
  }

  try {
    const { isHttpDebugEnabled, redactHeaders } = await import('./httpDebug');
    if (isHttpDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.log('[HTTP][OK]', {
        method: 'POST',
        url,
        tookMs: Date.now() - start,
        request: { headers: redactHeaders(reqHeaders), bodyText: reqBodyText },
        response: {
          status: res.status,
          statusText: res.statusText,
          headers: redactHeaders(headersToRecord(res.headers)),
          bodyText: responseText,
        },
      });
    }
  } catch {
    // ignore debug logger errors
  }

  return responseText;
}

export async function postFormData<TResponse>(
  baseUrl: string,
  path: string,
  formData: FormData,
  init?: Omit<RequestInit, 'method' | 'body'>
): Promise<TResponse> {
  const url = joinUrl(baseUrl, path);
  const res = await fetch(url, {
    ...init,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...normalizeHeaders(init?.headers),
    },
    body: formData,
  });

  if (!res.ok) {
    const bodyText = await safeReadText(res);
    notifyHttpError(res.status, bodyText);
    throw new HttpError(`POST ${url} -> HTTP ${res.status} ${res.statusText}`, res.status, bodyText);
  }

  return await parseJsonResponse<TResponse>(res, url);
}

export async function putJson<TRequest extends object, TResponse>(
  baseUrl: string,
  path: string,
  body: TRequest,
  init?: Omit<RequestInit, 'method' | 'body'>
): Promise<TResponse> {
  const url = joinUrl(baseUrl, path);
  const res = await fetch(url, {
    ...init,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...normalizeHeaders(init?.headers),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const bodyText = await safeReadText(res);
    notifyHttpError(res.status, bodyText);
    throw new HttpError(`PUT ${url} -> HTTP ${res.status} ${res.statusText}`, res.status, bodyText);
  }

  return await parseJsonResponse<TResponse>(res, url);
}

export async function getBlob(
  baseUrl: string,
  pathOrAbsoluteUrl: string,
  init?: Omit<RequestInit, 'method' | 'body'>
): Promise<Blob> {
  const url = isAbsoluteUrl(pathOrAbsoluteUrl)
    ? pathOrAbsoluteUrl
    : joinUrl(baseUrl, pathOrAbsoluteUrl);

  const res = await fetch(url, {
    ...init,
    method: 'GET',
    headers: {
      ...normalizeHeaders(init?.headers),
    },
  });

  if (!res.ok) {
    const bodyText = await safeReadText(res);
    notifyHttpError(res.status, bodyText);
    throw new HttpError(`GET ${url} -> HTTP ${res.status} ${res.statusText}`, res.status, bodyText);
  }

  return await res.blob();
}

async function safeReadText(res: Response): Promise<string | null> {
  try {
    return await res.text();
  } catch {
    return null;
  }
}

async function parseJsonResponse<T>(res: Response, url: string): Promise<T> {
  const contentType = res.headers.get('content-type') ?? '';
  const text = await res.text();

  if (!text) {
    throw new Error(`Respuesta vacía al parsear JSON: ${url}`);
  }

  if (!/application\/json/i.test(contentType)) {
    const preview = text.slice(0, 250);
    throw new Error(
      `La respuesta no es JSON (Content-Type: ${contentType || 'desconocido'}): ${preview}`
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const preview = text.slice(0, 250);
    throw new Error(`JSON inválido: ${preview}`);
  }
}

function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
