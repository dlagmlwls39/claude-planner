import { describe, it, expect } from "vitest";
import { generateFriendCode } from "@/lib/friend-code";

describe("generateFriendCode", () => {
  it("6자리 대문자+숫자", () => {
    const code = generateFriendCode();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });
});
