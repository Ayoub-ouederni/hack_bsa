const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function hashFile(file: File): Promise<string> {
  if (file.size === 0) {
    throw new Error("Cannot hash an empty file");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large for hashing: ${(file.size / 1024 / 1024).toFixed(1)} MB (max ${MAX_FILE_SIZE / 1024 / 1024} MB)`
    );
  }
  const buffer = await file.arrayBuffer();
  return hashArrayBuffer(buffer);
}

export async function hashBlob(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  return hashArrayBuffer(buffer);
}

export async function hashArrayBuffer(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return bufferToHex(hashBuffer);
}

export async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(hashBuffer);
}

export function normalizeSha256Hex(hash: string): string {
  const normalized = hash.toLowerCase().trim();
  if (!isValidSha256Hex(normalized)) {
    throw new Error(`Invalid SHA-256 hash: ${hash}`);
  }
  return normalized;
}

export function isValidSha256Hex(hash: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(hash);
}

export async function verifyFileHash(
  file: File,
  expectedHash: string
): Promise<boolean> {
  const actualHash = await hashFile(file);
  return constantTimeEqual(actualHash, expectedHash.toLowerCase());
}

export function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("Hex string must have even length");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
