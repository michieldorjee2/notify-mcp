import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vercel/kv", () => ({
  kv: { get: vi.fn(), set: vi.fn(), del: vi.fn() },
}));

import { kv } from "@vercel/kv";
import { generatePIN, savePIN, getWebhookUrl, deletePIN } from "@/lib/store";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("store", () => {
  describe("generatePIN", () => {
    it("returns a 6-character uppercase hex string", () => {
      const pin = generatePIN();
      expect(pin).toMatch(/^[A-F0-9]{6}$/);
    });

    it("generates unique PINs", () => {
      const pins = new Set(Array.from({ length: 100 }, () => generatePIN()));
      expect(pins.size).toBeGreaterThan(90);
    });
  });

  describe("savePIN", () => {
    it("stores webhook URL with pin: prefix", async () => {
      await savePIN("ABC123", "https://example.com/hook");
      expect(kv.set).toHaveBeenCalledWith("pin:ABC123", "https://example.com/hook");
    });
  });

  describe("getWebhookUrl", () => {
    it("returns URL for existing PIN", async () => {
      vi.mocked(kv.get).mockResolvedValue("https://example.com/hook");
      const result = await getWebhookUrl("ABC123");
      expect(kv.get).toHaveBeenCalledWith("pin:ABC123");
      expect(result).toBe("https://example.com/hook");
    });

    it("returns null for missing PIN", async () => {
      vi.mocked(kv.get).mockResolvedValue(null);
      expect(await getWebhookUrl("MISSING")).toBeNull();
    });
  });

  describe("deletePIN", () => {
    it("deletes by pin: prefixed key", async () => {
      await deletePIN("ABC123");
      expect(kv.del).toHaveBeenCalledWith("pin:ABC123");
    });
  });
});
