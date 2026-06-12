import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("axios", () => ({ default: { request: vi.fn() } }));

import axios from "axios";
import { httpRequest, cachedRequest } from "./httpClient.js";
import { cacheClear } from "./cache.js";

const mockRequest = axios.request as unknown as ReturnType<typeof vi.fn>;

describe("httpClient", () => {
  beforeEach(() => {
    mockRequest.mockReset();
    cacheClear();
  });

  it("retries on 5xx then succeeds", async () => {
    mockRequest
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce({ data: "ok" });
    const result = await httpRequest<string>({ url: "x" });
    expect(result).toBe("ok");
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  it("does not retry on 4xx (except 429)", async () => {
    mockRequest.mockRejectedValueOnce({ response: { status: 400 } });
    await expect(httpRequest({ url: "x" })).rejects.toBeTruthy();
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it("cachedRequest serves the second call from cache", async () => {
    mockRequest.mockResolvedValue({ data: "v" });
    await cachedRequest({ url: "u", params: { a: 1 } }, 10000);
    await cachedRequest({ url: "u", params: { a: 1 } }, 10000);
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });
});
