import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vercel/kv", () => ({
  kv: { get: vi.fn(), set: vi.fn(), del: vi.fn() },
}));

import { handleRegisterWebhook } from "@/lib/tools/register-webhook";
import { kv } from "@vercel/kv";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("register_webhook tool", () => {
  it("stores webhook and returns a PIN", async () => {
    vi.mocked(kv.set).mockResolvedValue("OK");

    const result = await handleRegisterWebhook({
      channel: "teams",
      webhook_url: "https://webhook.example.com/test",
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("PIN is:");

    // Verify KV was called with pin: prefix
    expect(kv.set).toHaveBeenCalledOnce();
    const [key, value] = vi.mocked(kv.set).mock.calls[0];
    expect(key).toMatch(/^pin:[A-F0-9]{6}$/);
    expect(value).toBe("https://webhook.example.com/test");
  });

  it("returns error when storage fails", async () => {
    vi.mocked(kv.set).mockRejectedValue(new Error("Redis connection failed"));

    const result = await handleRegisterWebhook({
      channel: "teams",
      webhook_url: "https://webhook.example.com/test",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to store");
  });
});
