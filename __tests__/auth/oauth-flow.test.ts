import { describe, it, expect } from "vitest";
import { isValidToken } from "@/lib/auth";

describe("auth helpers", () => {
  describe("isValidToken", () => {
    it("accepts tokens with notify_ prefix", () => {
      expect(isValidToken("notify_abc123")).toBe(true);
    });

    it("rejects tokens without prefix", () => {
      expect(isValidToken("random_token")).toBe(false);
    });

    it("rejects undefined", () => {
      expect(isValidToken(undefined)).toBe(false);
    });

    it("rejects empty string", () => {
      expect(isValidToken("")).toBe(false);
    });
  });
});
