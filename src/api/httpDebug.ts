function envFlag(name: string): boolean {
  const raw = process?.env?.[name];
  return String(raw ?? '').trim().toLowerCase() === 'true';
}

export function isHttpDebugEnabled(): boolean {
  return envFlag('EXPO_PUBLIC_DEBUG_HTTP');
}

function redactValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if (value.length <= 8) return '[redacted]';
  return `[redacted len=${value.length}]`;
}

export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { ...headers };
  for (const key of Object.keys(out)) {
    if (/authorization/i.test(key)) out[key] = '[redacted]';
    if (/cookie/i.test(key)) out[key] = '[redacted]';
  }
  return out;
}

export function redactJsonBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const out: Record<string, unknown> = { ...(body as any) };

  // Campos sensibles / largos típicos del auth biométrico y login normal.
  for (const k of ['password', 'jwt', 'token', 'signature', 'publicKey']) {
    if (k in out) out[k] = redactValue(out[k]);
  }

  return out;
}

