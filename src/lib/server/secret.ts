/**
 * LiveShop — single source of truth for the auth secret (fix v1.5.1 #4).
 *
 * Every HMAC/hash/JWT key must derive from getAuthSecret(). There is
 * deliberately NO fallback: an unset or weak secret fails loudly instead of
 * silently degrading to an empty string — with an empty key, OTP code hashes
 * and refresh-token hashes would be trivially forgeable.
 */
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or shorter than 32 chars — set a strong value in .env (openssl rand -hex 32)",
    );
  }
  return secret;
}
