import { describe, expect, it } from 'vitest';
import {
  isPasswordChangeAttempt,
  isValidEmail,
  isValidPhone,
  validateSettingsForm,
} from './validateSettingsForm.js';

const validBase = {
  name: 'Sohail',
  email: 'sohail@example.com',
  phone: '+12345678901',
  street: '',
  city: '',
  postalCode: '',
  country: '',
  password: '',
  confirmPassword: '',
  currentPassword: '',
};

describe('validateSettingsForm', () => {
  it('returns required errors on empty submit', () => {
    const errors = validateSettingsForm({
      name: '  ',
      email: '',
      phone: '',
      street: '',
      city: '',
      postalCode: '',
      country: '',
      password: '',
      confirmPassword: '',
      currentPassword: '',
    });

    expect(errors.name).toBeTruthy();
    expect(errors.email).toBeTruthy();
    expect(errors.phone).toBeTruthy();
    expect(errors.password).toBeUndefined();
  });

  it('rejects invalid email format', () => {
    const errors = validateSettingsForm({
      ...validBase,
      email: 'not-an-email',
    });
    expect(errors.email).toMatch(/valid email/i);
  });

  it('rejects invalid phone format', () => {
    const errors = validateSettingsForm({
      ...validBase,
      phone: '123',
    });
    expect(errors.phone).toMatch(/phone/i);
  });

  it('rejects passwords shorter than 8 characters when changing', () => {
    const errors = validateSettingsForm({
      ...validBase,
      password: 'short',
      confirmPassword: 'short',
      currentPassword: 'old-password',
    });
    expect(errors.password).toMatch(/8/);
  });

  it('rejects mismatched password confirmation', () => {
    const errors = validateSettingsForm({
      ...validBase,
      password: 'newpass12',
      confirmPassword: 'newpass13',
      currentPassword: 'old-password',
    });
    expect(errors.confirmPassword).toMatch(/match/i);
  });

  it('skips password rules when all password fields are empty', () => {
    const errors = validateSettingsForm(validBase);
    expect(errors).toEqual({});
    expect(isPasswordChangeAttempt(validBase)).toBe(false);
  });

  it('requires current password when changing password', () => {
    const errors = validateSettingsForm({
      ...validBase,
      password: 'newpass12',
      confirmPassword: 'newpass12',
      currentPassword: '',
    });
    expect(errors.currentPassword).toBeTruthy();
  });

  it('returns an empty object for a valid payload', () => {
    expect(
      validateSettingsForm({
        ...validBase,
        street: '12 Main St',
        city: 'Karachi',
        postalCode: '74000',
        country: 'Pakistan',
      })
    ).toEqual({});
  });
});

describe('helpers', () => {
  it('validates email and phone helpers', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('nope')).toBe(false);
    expect(isValidPhone('(555) 123-4567')).toBe(true);
    expect(isValidPhone('555-12')).toBe(false);
  });
});
