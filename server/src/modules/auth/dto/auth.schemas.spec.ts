import { describe, expect, it } from 'vitest';
import {
  emailSignupSchema,
  phoneCodeSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.schemas.js';

describe('auth request schemas', () => {
  it('normalizes email and rejects weak passwords and extra fields', () => {
    expect(
      emailSignupSchema.parse({
        email: 'USER@Example.COM',
        password: 'a-long-password-123',
      }).email,
    ).toBe('user@example.com');
    expect(
      emailSignupSchema.safeParse({ email: 'a@example.com', password: 'short' })
        .success,
    ).toBe(false);
    expect(
      emailSignupSchema.safeParse({
        email: 'a@example.com',
        password: 'a-long-password-123',
        admin: true,
      }).success,
    ).toBe(false);
    expect(
      verifyEmailSchema.safeParse({ email: 'a@example.com', code: '123456' })
        .success,
    ).toBe(false);
  });

  it('requires an E.164 phone and exactly six digits', () => {
    expect(
      phoneCodeSchema.safeParse({ phone: '+8801712345678', code: '012345' })
        .success,
    ).toBe(true);
    expect(
      phoneCodeSchema.safeParse({ phone: '01712345678', code: '12345' })
        .success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({
        email: 'a@example.com',
        code: '123456',
        password: '123456789012',
      }).success,
    ).toBe(true);
  });
});
