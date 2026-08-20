// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AmountInput } from "@/components/ui/amount-input";

function setup(props: Partial<Parameters<typeof AmountInput>[0]> = {}) {
  render(<AmountInput name="amount" {...props} />);
  return {
    input: screen.getByRole("textbox") as HTMLInputElement,
    user: userEvent.setup(),
  };
}

describe("AmountInput", () => {
  it("starts at zero when no default is given", () => {
    const { input } = setup();
    expect(input).toHaveValue("0.00");
  });

  it("renders a default value from cents", () => {
    const { input } = setup({ defaultCents: 4550 });
    expect(input).toHaveValue("45.50");
  });

  it("fills sen first, calculator style", async () => {
    const { input, user } = setup();
    await user.click(input);
    await user.keyboard("1");
    expect(input).toHaveValue("0.01");
    await user.keyboard("2");
    expect(input).toHaveValue("0.12");
    await user.keyboard("5");
    expect(input).toHaveValue("1.25");
  });

  it("groups a large amount correctly", async () => {
    const { input, user } = setup();
    await user.click(input);
    await user.keyboard("123456");
    expect(input).toHaveValue("1234.56");
  });

  it("ignores non-digit characters", async () => {
    const { input, user } = setup();
    await user.click(input);
    await user.keyboard("1a2!b3");
    expect(input).toHaveValue("1.23");
  });

  it("ignores a typed decimal point rather than doubling it", async () => {
    const { input, user } = setup();
    await user.click(input);
    await user.keyboard("12.34");
    expect(input).toHaveValue("12.34");
  });

  it("deletes from the right", async () => {
    const { input, user } = setup({ defaultCents: 12345 });
    await user.click(input);
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("12.34");
  });

  it("returns to zero when fully cleared", async () => {
    const { input, user } = setup({ defaultCents: 100 });
    await user.click(input);
    await user.keyboard("{Backspace}{Backspace}{Backspace}");
    expect(input).toHaveValue("0.00");
  });

  it("refuses input beyond the RM 999,999.99 ceiling", async () => {
    const { input, user } = setup({ defaultCents: 99_999_999 });
    expect(input).toHaveValue("999999.99");
    await user.click(input);
    await user.keyboard("9");
    expect(input).toHaveValue("999999.99");
  });

  it("submits under the given field name", () => {
    const { input } = setup({ name: "monthlyLimit", defaultCents: 800_00 });
    expect(input).toHaveAttribute("name", "monthlyLimit");
  });

  it("uses a numeric keypad on mobile", () => {
    const { input } = setup();
    expect(input).toHaveAttribute("inputMode", "numeric");
  });

  it("passes through the required flag", () => {
    const { input } = setup({ required: true });
    expect(input).toBeRequired();
  });
});
