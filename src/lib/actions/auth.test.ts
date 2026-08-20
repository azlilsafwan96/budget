import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, signIn, signOut, hash } = vi.hoisted(() => ({
  prisma: { user: { findUnique: vi.fn(), create: vi.fn() } },
  signIn: vi.fn(),
  signOut: vi.fn(),
  hash: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/auth", () => ({ signIn, signOut }));
vi.mock("bcryptjs", () => ({ default: { hash } }));
// next-auth's real AuthError is a class we need to construct in tests.
vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));

const { register, login, logout } = await import("@/lib/actions/auth");
const { AuthError } = await import("next-auth");

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const validFields = { name: "Azlil", email: "user@example.com", password: "supersecret" };

beforeEach(() => {
  vi.clearAllMocks();
  prisma.user.findUnique.mockResolvedValue(null);
  hash.mockResolvedValue("hashed");
});

describe("register", () => {
  it("rejects a name shorter than 2 characters", async () => {
    const state = await register(undefined, form({ ...validFields, name: "A" }));
    expect(state?.errors?.name).toBeDefined();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("rejects a malformed email", async () => {
    const state = await register(undefined, form({ ...validFields, email: "not-an-email" }));
    expect(state?.errors?.email).toBeDefined();
  });

  it("rejects a password shorter than 8 characters", async () => {
    const state = await register(undefined, form({ ...validFields, password: "short" }));
    expect(state?.errors?.password).toBeDefined();
  });

  it("reports every invalid field at once", async () => {
    const state = await register(undefined, form({ name: "A", email: "x", password: "y" }));
    expect(state?.errors?.name).toBeDefined();
    expect(state?.errors?.email).toBeDefined();
    expect(state?.errors?.password).toBeDefined();
  });

  it("refuses an email that already has an account", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "user_1" });
    const state = await register(undefined, form(validFields));
    expect(state?.message).toBe("An account with that email already exists.");
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("never stores the raw password", async () => {
    await register(undefined, form(validFields));
    expect(hash).toHaveBeenCalledWith("supersecret", 10);
    const created = prisma.user.create.mock.calls[0][0].data;
    expect(created.passwordHash).toBe("hashed");
    expect(JSON.stringify(created)).not.toContain("supersecret");
  });

  it("signs the new user straight in", async () => {
    await register(undefined, form(validFields));
    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "supersecret",
      redirectTo: "/dashboard",
    });
  });

  it("trims surrounding whitespace from the name", async () => {
    await register(undefined, form({ ...validFields, name: " Azlil " }));
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: "Azlil" }) }),
    );
  });

  it("accepts and trims a pasted email with surrounding whitespace", async () => {
    await register(undefined, form({ ...validFields, email: " user@example.com " }));
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ email: "user@example.com" }) }),
    );
  });

  it("rejects a name that is only whitespace", async () => {
    // Guards the validate-then-trim ordering: "  " is 2 characters, so it used
    // to satisfy min(2) and then trim down to an empty name.
    const state = await register(undefined, form({ ...validFields, name: "  " }));
    expect(state?.errors?.name).toBeDefined();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("measures password length on the literal input", async () => {
    // The password is no longer trimmed, so length is whatever the user typed.
    // "  abc  " is 7 characters and fails; padding it to 8 makes it a valid
    // 8-character password, which is exactly what gets hashed and compared.
    const short = await register(undefined, form({ ...validFields, password: "  abc  " }));
    expect(short?.errors?.password).toBeDefined();

    const ok = await register(undefined, form({ ...validFields, password: "  abc   " }));
    expect(ok?.errors).toBeUndefined();
    expect(hash).toHaveBeenLastCalledWith("  abc   ", 10);
  });

  it("hashes the password exactly as typed", async () => {
    // src/auth.ts compares the raw submitted password on login, so registration
    // must not transform it — a trimmed hash would lock the user out.
    await register(undefined, form({ ...validFields, password: " keeps spaces " }));
    expect(hash).toHaveBeenCalledWith(" keeps spaces ", 10);
  });
});

describe("login", () => {
  it("returns a generic message on bad credentials", async () => {
    signIn.mockRejectedValue(new AuthError("CredentialsSignin"));
    const state = await login(undefined, form({ email: "a@b.com", password: "wrong" }));
    expect(state?.message).toBe("Invalid email or password.");
  });

  it("gives the same message for an unknown email as for a wrong password", async () => {
    // The message must not let an attacker enumerate registered accounts.
    signIn.mockRejectedValue(new AuthError("CredentialsSignin"));
    const unknownEmail = await login(undefined, form({ email: "nobody@b.com", password: "x" }));
    const wrongPassword = await login(undefined, form({ email: "a@b.com", password: "wrong" }));
    expect(unknownEmail?.message).toBe(wrongPassword?.message);
  });

  it("rethrows non-auth errors so redirects still work", async () => {
    // next/navigation signals redirects by throwing — swallowing that would
    // break the post-login navigation.
    signIn.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(login(undefined, form({ email: "a@b.com", password: "x" }))).rejects.toThrow(
      "NEXT_REDIRECT",
    );
  });
});

describe("logout", () => {
  it("sends the user back to the login page", async () => {
    await logout();
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/login" });
  });
});
