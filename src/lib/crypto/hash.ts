export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
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

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
