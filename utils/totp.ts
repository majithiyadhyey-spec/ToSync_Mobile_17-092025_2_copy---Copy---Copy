
import { base32Encode } from './base32';

/**
 * Generates a cryptographically secure 160-bit (20-byte) secret key for 2FA,
 * encoded in Base32 format.
 * @returns A Base32 encoded secret key string.
 */
export function generateSecret(): string {
  const buffer = new Uint8Array(20); // 160 bits is recommended for TOTP secrets.
  crypto.getRandomValues(buffer);
  return base32Encode(buffer);
}

/**
 * Decodes a Base32 string into a Uint8Array. This implementation adheres to RFC 4648.
 * @param base32 The Base32 string to decode, case-insensitive and ignores padding.
 * @returns A Uint8Array containing the decoded binary data.
 */
function base32Decode(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const lookup: { [key: string]: number } = {};
  for (let i = 0; i < alphabet.length; i++) {
    lookup[alphabet[i]] = i;
  }

  // Remove padding and convert to uppercase.
  const cleanInput = base32.toUpperCase().replace(/=+$/, '');
  
  // Convert base32 characters to a string of bits.
  const bits = cleanInput.split('').map(char => {
      const value = lookup[char];
      if (value === undefined) {
          throw new Error('Invalid Base32 character found in secret');
      }
      return value.toString(2).padStart(5, '0');
  }).join('');

  // Group bits into 8-bit bytes.
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
      const chunk = bits.slice(i, i + 8);
      // Ignore chunks that are not a full byte (handles padding implicitly).
      if (chunk.length === 8) {
          bytes.push(parseInt(chunk, 2));
      }
  }

  return new Uint8Array(bytes);
}

/**
 * Implements the HOTP (HMAC-based One-Time Password) algorithm using the Web Crypto API.
 * @param key The secret key as a Uint8Array.
 * @param counter The time step or counter value.
 * @returns A promise that resolves to a 6-digit HOTP token as a string.
 */
async function hotpAsync(key: Uint8Array, counter: number): Promise<string> {
    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    // Set the 32 least significant bits, as JS numbers are safe up to 53 bits.
    counterView.setUint32(4, counter, false); // big-endian

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
    );

    const hmacResult = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
    const hmac = new Uint8Array(hmacResult);

    // Dynamic truncation as per RFC 4226.
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);

    const otp = binary % 1000000;

    // Pad with leading zeros to ensure a 6-digit code.
    return otp.toString().padStart(6, '0');
}


/**
 * Verifies a TOTP token against a secret key asynchronously.
 * It checks the token for the current time step, as well as the previous and next
 * time steps to account for clock drift.
 * @param secret The Base32 encoded secret key.
 * @param token The 6-digit TOTP token to verify.
 * @returns A promise that resolves to true if the token is valid, false otherwise.
 */
export async function verifyToken(secret: string, token: string): Promise<boolean> {
  if (!/^\d{6}$/.test(token)) {
    return false;
  }
  
  try {
    const key = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000.0);
    const timeStep = 30; // Standard TOTP time step is 30 seconds.

    // Check current, previous, and next time steps to allow for a +/- 30 second clock drift.
    for (let i = -1; i <= 1; i++) {
        const time = Math.floor(epoch / timeStep) + i;
        const currentToken = await hotpAsync(key, time);
        if (currentToken === token) {
            return true;
        }
    }
  } catch (error) {
    console.error("Error during token verification:", error);
    return false;
  }

  return false;
}
