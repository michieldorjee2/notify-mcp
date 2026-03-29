import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vercel/kv", () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

import { kv } from "@vercel/kv";
import { generatePIN, savePIN, getReference, deletePIN } from "@/lib/store";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("store", () => {
  describe("generatePIN", () => {
    it("returns a 6-character uppercase string", () => {
      const pin = generatePIN();
      expect(pin).toMatch(/^[A-F0-9]{6}$/);
      expect(pin).toHaveLength(6);
    });

    it("generates unique PINs", () => {
      const pins = new Set(Array.from({ length: 100 }, () => generatePIN()));
      expect(pins.size).toBeGreaterThan(90); // very unlikely to have collisions
    });
  });

  describe("savePIN", () => {
    it("stores reference with pin: prefix", async () => {
      const ref = { conversation: { id: "test" } };
      await savePIN("ABC123", ref);

      expect(kv.set).toHaveBeenCalledWith(
        "pin:ABC123",
        JSON.stringify(ref)
      );
    });
  });

  describe("getReference", () => {
    it("returns parsed reference for existing PIN", async () => {
      const ref = { conversation: { id: "test" } };
      vi.mocked(kv.get).mockResolvedValue(ref);

      const result = await getReference("ABC123");

      expect(kv.get).toHaveBeenCalledWith("pin:ABC123");
      expect(result).toEqual(ref);
    });

    it("returns null for missing PIN", async () => {
      vi.mocked(kv.get).mockResolvedValue(null);

      const result = await getReference("MISSING");

      expect(result).toBeNull();
    });
  });

  describe("deletePIN", () => {
    it("deletes by pin: prefixed key", async () => {
      await deletePIN("ABC123");

      expect(kv.del).toHaveBeenCalledWith("pin:ABC123");
    });
  });
});
