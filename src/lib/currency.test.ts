import { describe, expect, it } from "vitest";
import { fmt } from "@/lib/currency";

describe("fmt", () => {
  it("renders whole ringgit from cents", () => {
    expect(fmt(150_00)).toBe("RM 150");
  });

  it("groups thousands", () => {
    expect(fmt(1_234_56)).toBe("RM 1,234.56");
  });

  it("renders zero", () => {
    expect(fmt(0)).toBe("RM 0");
  });

  it("keeps sen when present", () => {
    expect(fmt(99)).toBe("RM 0.99");
  });

  it("renders negatives (over-budget remainders)", () => {
    expect(fmt(-25_00)).toBe("RM -25");
  });
});
