/**
 * Converts an ArrayBuffer into a Base64 encoded string.
 * @param buffer The ArrayBuffer to encode.
 * @returns A Base64 string.
 */
const bufferToBase64 = (buffer: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

/**
 * Converts a Base64 encoded string into an ArrayBuffer.
 * @param base64 The Base64 string to decode.
 * @returns An ArrayBuffer.
 */
const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Derives a cryptographic key from a password and salt using the PBKDF2 algorithm.
 * This makes brute-force attacks on the password much more difficult.
 * @param password The user-provided password.
 * @param salt A random salt to ensure unique keys even for the same password.
 * @returns A CryptoKey suitable for AES-GCM encryption/decryption.
 */
const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // A standard number of iterations for PBKDF2
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 }, // Key algorithm for the derived key
    true,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypts a string of data using a password. It generates a random salt and IV,
 * derives a key, and then performs AES-GCM encryption.
 * @param password The password to use for encryption.
 * @param dataString The plaintext data to encrypt.
 * @returns An object containing the salt, IV, and encrypted data, all as Base64 strings.
 */
export const encryptData = async (password: string, dataString: string): Promise<{ salt: string; iv: string; data: string; }> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes is recommended for AES-GCM
  const key = await deriveKey(password, salt);
  
  const enc = new TextEncoder();
  const encodedData = enc.encode(dataString);
  
  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    encodedData
  );

  return {
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
    data: bufferToBase64(encryptedContent)
  };
};

/**
 * Decrypts data that was encrypted with `encryptData` using the same password.
 * @param password The password used for encryption.
 * @param encryptedPayload An object containing the Base64-encoded salt, IV, and encrypted data.
 * @returns The decrypted plaintext string.
 */
export const decryptData = async (password: string, encryptedPayload: { salt: string; iv: string; data: string; }): Promise<string> => {
  const salt = base64ToBuffer(encryptedPayload.salt);
  const iv = base64ToBuffer(encryptedPayload.iv);
  const data = base64ToBuffer(encryptedPayload.data);

  const key = await deriveKey(password, new Uint8Array(salt));
  
  const decryptedContent = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    data
  );
  
  const dec = new TextDecoder();
  return dec.decode(decryptedContent);
};
