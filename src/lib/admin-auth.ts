import crypto from 'crypto';

export const AUTH_COOKIE_NAME = 'pairs_admin_auth';
export const AUTH_COOKIE_VALUE = 'valid_founder_session_abdullah17';

const DEFAULT_FALLBACK_PASSKEY = (process.env.ADMIN_PASSKEY || 'abdullahhanjra17')
  .trim()
  .toLowerCase();

/**
 * Hashes a password with a cryptographically secure random 16-byte salt using scrypt.
 * Format: scrypt:<saltHex>:<derivedKeyHex>
 */
export function hashPasskey(plainPassword: string): string {
  const clean = plainPassword.trim();
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(clean, salt, 64).toString('hex');
  return `scrypt:${salt}:${derivedKey}`;
}

/**
 * Verifies a candidate password against either the stored scrypt hash in PostgreSQL
 * or the initial fallback passkey if the founder has not customized it yet.
 * Uses constant-time comparison to prevent timing side-channel attacks.
 */
export function verifyPasskey(candidate: string, storedHash?: string | null): boolean {
  if (!candidate || typeof candidate !== 'string') return false;
  const cleanCandidate = candidate.trim();
  if (!cleanCandidate) return false;

  if (storedHash && storedHash.startsWith('scrypt:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const [, salt, storedKeyHex] = parts;

    try {
      const derivedKey = crypto.scryptSync(cleanCandidate, salt, 64);
      const storedKey = Buffer.from(storedKeyHex, 'hex');
      if (derivedKey.length !== storedKey.length) return false;
      return crypto.timingSafeEqual(derivedKey, storedKey);
    } catch {
      return false;
    }
  }

  // Fallback before first custom password is set
  const candidateBuf = Buffer.from(cleanCandidate.toLowerCase(), 'utf8');
  const fallbackBuf = Buffer.from(DEFAULT_FALLBACK_PASSKEY, 'utf8');
  if (candidateBuf.length !== fallbackBuf.length) return false;
  return crypto.timingSafeEqual(candidateBuf, fallbackBuf);
}
