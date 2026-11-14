export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function readLoginCredentials(emailValue: unknown, passwordValue: unknown) {
  const email = normalizeEmail(emailValue);
  if (!email || typeof passwordValue !== "string" || passwordValue.length === 0) return null;
  return { email, password: passwordValue };
}

export function isPasswordResetCode(value: unknown): value is string {
  return typeof value === "string" && /^\d{6}$/.test(value);
}
