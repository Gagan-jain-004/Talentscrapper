/**
 * Computes a SHA-256 hash using the environment's native Crypto API.
 * Compatible with Edge Middleware and standard Node.js environments.
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Creates an authenticated session token valid for 7 days.
 */
export async function createSessionToken(): Promise<string> {
  const pin = process.env.ACCESS_PIN || '';
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days in ms
  const hash = await sha256(`${expiresAt}:${pin}`);
  return `${expiresAt}.${hash}`;
}

/**
 * Verifies a session token against expiration and signature integrity.
 */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [expiresAtStr, hash] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);

  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return false; // Expired or malformed timestamp
  }

  const pin = process.env.ACCESS_PIN || '';
  const expectedHash = await sha256(`${expiresAtStr}:${pin}`);
  return hash === expectedHash;
}
