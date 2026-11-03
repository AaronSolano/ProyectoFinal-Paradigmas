const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCodeSuffix(length = 4): string {
  let suffix = "";
  for (let i = 0; i < length; i += 1) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return suffix;
}

/** Código único con formato PL-XXXX (6 caracteres visibles tras el prefijo). */
export function formatRoomCode(suffix: string): string {
  return `PL-${suffix}`;
}
