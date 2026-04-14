type JwtPayload = Record<string, unknown>;

function base64DecodeToBytes(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let i = 0;

  // Mantener el padding "=" porque el algoritmo espera grupos de 4.
  const input = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const bytes: number[] = [];
  while (i < input.length) {
    const enc1 = chars.indexOf(input.charAt(i++));
    const enc2 = chars.indexOf(input.charAt(i++));
    const enc3 = chars.indexOf(input.charAt(i++));
    const enc4 = chars.indexOf(input.charAt(i++));

    if (enc1 < 0 || enc2 < 0 || enc3 < 0 || enc4 < 0) break;

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    bytes.push(chr1);
    if (enc3 !== 64) bytes.push(chr2);
    if (enc4 !== 64) bytes.push(chr3);
  }

  return Uint8Array.from(bytes);
}

function base64UrlToBase64(base64Url: string): string {
  const padded = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return `${padded}${'='.repeat(padLen)}`;
}

function decodeUtf8(bytes: Uint8Array): string {
  try {
    // Hermes/modern RN suele tener TextDecoder disponible
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const td = new (globalThis as any).TextDecoder('utf-8');
    return td.decode(bytes);
  } catch {
    try {
      const percent = Array.from(bytes)
        .map((b) => `%${b.toString(16).padStart(2, '0')}`)
        .join('');
      return decodeURIComponent(percent);
    } catch {
      let str = '';
      for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i] ?? 0);
      return str;
    }
  }
}

export function decodeJwtPayload(jwt: string | null): JwtPayload | null {
  if (!jwt) return null;
  const parts = jwt.split('.');
  if (parts.length < 2) return null;
  const payloadB64 = base64UrlToBase64(parts[1] ?? '');
  try {
    const json = decodeUtf8(base64DecodeToBytes(payloadB64));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function toStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return [value];
  return [];
}

function normalizeRoleValue(value: string): string[] {
  const raw = String(value ?? '').trim();
  if (!raw) return [];
  const upper = raw.toUpperCase();
  if (upper.startsWith('ROLE_')) return [upper, upper.slice('ROLE_'.length)];
  return [upper];
}

export function getRolesFromJwt(jwt: string | null): string[] {
  const payload = decodeJwtPayload(jwt);
  if (!payload) return [];

  const rol = toStringArray(payload.rol);
  if (rol.length) return rol.flatMap(normalizeRoleValue);
  const role = toStringArray(payload.role);
  if (role.length) return role.flatMap(normalizeRoleValue);
  const roles = toStringArray(payload.roles);
  if (roles.length) return roles.flatMap(normalizeRoleValue);

  const authorities = payload.authorities;
  if (Array.isArray(authorities)) {
    const flattened = authorities
      .map((a) => {
        if (typeof a === 'string') return a;
        if (a && typeof a === 'object' && 'authority' in a) return String((a as any).authority);
        return null;
      })
      .filter(Boolean) as string[];
    if (flattened.length) return flattened.flatMap(normalizeRoleValue);
  }

  const scope = payload.scope ?? payload.scp;
  if (typeof scope === 'string') return scope.split(/\s+/).filter(Boolean).flatMap(normalizeRoleValue);

  return [];
}

export function getRolFromJwt(jwt: string | null): string | null {
  const payload = decodeJwtPayload(jwt);
  const raw = payload?.rol;
  if (typeof raw !== 'string') return null;
  const normalized = normalizeRoleValue(raw);
  return normalized[0] ?? null;
}

export function hasRole(jwt: string | null, role: string): boolean {
  const roles = getRolesFromJwt(jwt);
  const target = role.toUpperCase();
  return roles.includes(target) || roles.includes(`ROLE_${target}`);
}

export function getUsernameFromJwt(jwt: string | null): string | null {
  const payload = decodeJwtPayload(jwt);
  if (!payload) return null;

  const candidates = [
    payload.sub,
    (payload as any).username,
    (payload as any).user_name,
    (payload as any).preferred_username,
    (payload as any).email,
  ];

  for (const c of candidates) {
    if (typeof c === 'string') {
      const v = c.trim();
      if (v) return v;
    }
  }
  return null;
}
