import { describe, expect, it } from "vitest";
import {
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  formatRoomCode,
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
} from "@/domain/room-code";

describe("room codes", () => {
  it("generates valid six-character codes", () => {
    for (let i = 0; i < 2000; i++) {
      const code = generateRoomCode();
      expect(code).toHaveLength(ROOM_CODE_LENGTH);
      expect(isValidRoomCode(code)).toBe(true);
    }
  });

  it("never uses vowels or look-alike characters", () => {
    expect(ROOM_CODE_ALPHABET).not.toMatch(/[AEIOUY01LO]/);
  });

  it("rarely collides", () => {
    const codes = new Set(Array.from({ length: 5000 }, () => generateRoomCode()));
    expect(codes.size).toBeGreaterThan(4990);
  });

  it("rejects biased bytes instead of folding them (rejection sampling)", () => {
    // 255 is above the largest multiple of 27 below 256 and must be skipped.
    let call = 0;
    const source = (size: number) => {
      call += 1;
      return new Uint8Array(size).fill(call === 1 ? 255 : 0);
    };
    expect(generateRoomCode(source)).toBe(ROOM_CODE_ALPHABET[0]!.repeat(6));
  });

  it("fails loudly on a broken random source", () => {
    expect(() => generateRoomCode((size) => new Uint8Array(size).fill(255))).toThrow();
  });

  it("normalises user input", () => {
    expect(normalizeRoomCode(" kx4-9qt ")).toBe("KX49QT");
    expect(isValidRoomCode(normalizeRoomCode("bcd 234"))).toBe(true);
  });

  it("rejects invalid codes", () => {
    for (const bad of ["", "BCD23", "BCD2345", "ABCDEF", "BCD10O", "bcd234", "BCD-23"]) {
      expect(isValidRoomCode(bad)).toBe(false);
    }
  });

  it("formats for display", () => {
    expect(formatRoomCode("KX49QT")).toBe("KX4-9QT");
  });
});
