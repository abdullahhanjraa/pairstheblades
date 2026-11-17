export const AUTH_COOKIE_NAME = 'pairs_admin_auth';
export const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

const HMAC_SECRET =
  process.env.ADMIN_SESSION_SECRET || 'pairs-blades-founder-hmac-v2-2026-x9k2p8m4';

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(base64url: string): string {
  const padded = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + '='.repeat(padLen));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function bytesToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array | null {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function getHmacKey(usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(HMAC_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  );
}

export interface SessionPayload {
  v: number; // Store.adminSessionVersion (incremented on every password change)
  iat: number;
  exp: number;
}

export async function createSignedSessionToken(sessionVersion: number): Promise<string> {
  const now = Date.now();
  const payload: SessionPayload = {
    v: sessionVersion,
    iat: now,
    exp: now + SESSION_TTL_MS,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const key = await getHmacKey('sign');
  const sigBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(encodedPayload)
  );
  return `${encodedPayload}.${bytesToHex(sigBuffer)}`;
}

export async function verifySignedSessionToken(
  token?: string | null
): Promise<{ valid: boolean; version?: number }> {
  if (!token || typeof token !== 'string') return { valid: false };
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };

  const [encodedPayload, sigHex] = parts;
  if (!encodedPayload || !sigHex) return { valid: false };

  const sigBytes = hexToBytes(sigHex);
  if (!sigBytes) return { valid: false };

  try {
    const key = await getHmacKey('verify');
    const isSigValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      new TextEncoder().encode(encodedPayload)
    );
    if (!isSigValid) return { valid: false };

    const parsed = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload;
    if (
      typeof parsed?.v !== 'number' ||
      typeof parsed?.exp !== 'number' ||
      Date.now() >= parsed.exp
    ) {
      return { valid: false };
    }

    return { valid: true, version: parsed.v };
  } catch {
    return { valid: false };
  }
}
