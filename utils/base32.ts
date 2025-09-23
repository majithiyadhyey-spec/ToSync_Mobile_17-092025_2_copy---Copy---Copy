// This file implements Base32 encoding as specified in RFC 4648.
// It's a necessary component for generating and displaying TOTP secrets
// in a format compatible with authenticator apps.

// The standard Base32 alphabet.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes an ArrayBuffer into a Base32 string.
 * @param buffer The ArrayBuffer containing the binary data to encode (e.g., a secret key).
 * @returns The Base32 encoded string.
 */
export function base32Encode(buffer: ArrayBuffer): string {
    const view = new Uint8Array(buffer);
    let bits = 0;
    let bitLength = 0;
    let result = '';

    for (let i = 0; i < view.length; i++) {
        // Shift the existing bits left by 8 and add the new byte.
        bits = (bits << 8) | view[i];
        bitLength += 8;

        // While there are enough bits to form a 5-bit character, process them.
        while (bitLength >= 5) {
            // Get the 5 most significant bits and find the corresponding character.
            result += ALPHABET[(bits >>> (bitLength - 5)) & 31];
            bitLength -= 5;
        }
    }

    // If there are any remaining bits, pad with zeros to form a final 5-bit character.
    if (bitLength > 0) {
        result += ALPHABET[(bits << (5 - bitLength)) & 31];
    }

    return result;
}
