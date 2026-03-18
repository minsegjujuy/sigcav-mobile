export class HttpError extends Error {
  readonly status: number;
  readonly bodyText: string | null;

  constructor(message: string, status: number, bodyText: string | null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.bodyText = bodyText;
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

export async function getJson<TResponse>(
  baseUrl: string,
  pathOrAbsoluteUrl: string,
  init?: Omit<RequestInit, 'method' | 'body'>
): Promise<TResponse> {
  const url = isAbsoluteUrl(pathOrAbsoluteUrl)
    ? pathOrAbsoluteUrl
    : joinUrl(baseUrl, pathOrAbsoluteUrl);

  const res = await fetch(url, {
    ...init,
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...normalizeHeaders(init?.headers),
    },
  });

  if (!res.ok) {
    const bodyText = await safeReadText(res);
    throw new HttpError(`GET ${url} -> HTTP ${res.status} ${res.statusText}`, res.status, bodyText);
  }

  return await parseJsonResponse<TResponse>(res, url);
}

export async function postJson<TRequest extends object, TResponse>(
  baseUrl: string,
  path: string,
  body: TRequest,
  init?: Omit<RequestInit, 'method' | 'body'>
): Promise<TResponse> {
  const url = joinUrl(baseUrl, path);
  const res = await fetch(url, {
    ...init,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...normalizeHeaders(init?.headers),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const bodyText = await safeReadText(res);
    throw new HttpError(`POST ${url} -> HTTP ${res.status} ${res.statusText}`, res.status, bodyText);
  }

  return await parseJsonResponse<TResponse>(res, url);
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
