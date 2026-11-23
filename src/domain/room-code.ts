/**
 * Six-character room codes.
 *
 * The alphabet has no vowels or Y (so codes can't spell words) and no look-alike characters
 * (0/O, 1/I/L), which keeps codes safe for children and easy to read off a projector.
 * 27^6 ≈ 387 million combinations. Uniqueness among active rooms is enforced by a
 * database index; the database generates codes with the same alphabet.
 */
export const ROOM_CODE_ALPHABET = "BCDFGHJKMNPQRSTVWXZ23456789" as const;
export const ROOM_CODE_LENGTH = 6;

const VALID_CODE = new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`);

type RandomBytes = (size: number) => Uint8Array;

const defaultRandomBytes: RandomBytes = (size) => {
  const bytes = new Uint8Array(size);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
};

/** Uniform random code using rejection sampling (no modulo bias). */
export function generateRoomCode(randomBytes: RandomBytes = defaultRandomBytes): string {
  const size = ROOM_CODE_ALPHABET.length;
  const limit = 256 - (256 % size); // largest multiple of `size` below 256
  let code = "";
  let guard = 0;
  while (code.length < ROOM_CODE_LENGTH) {
    if (++guard > 1000) throw new Error("Random source is not producing usable bytes");
    for (const byte of randomBytes(ROOM_CODE_LENGTH * 2)) {
      if (byte >= limit) continue;
      code += ROOM_CODE_ALPHABET[byte % size];
      if (code.length === ROOM_CODE_LENGTH) break;
    }
  }
  return code;
}

/** Tidies what a player typed: case, spaces and dashes don't matter. */
export function normalizeRoomCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]+/g, "");
}

export function isValidRoomCode(input: string): boolean {
  return VALID_CODE.test(input);
}

/** Display form, e.g. "KX4-9QT", easier to read aloud. */
export function formatRoomCode(code: string): string {
  return code.length === ROOM_CODE_LENGTH ? `${code.slice(0, 3)}-${code.slice(3)}` : code;
}
