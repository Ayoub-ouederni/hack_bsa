export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
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

export function isValidSha256Hex(hash: string): boolean {
  return /^[0-9a-f]{64}$/.test(hash);
}

export async function verifyFileHash(
  file: File,
  expectedHash: string
): Promise<boolean> {
  const actualHash = await hashFile(file);
  return actualHash === expectedHash.toLowerCase();
}

export function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
