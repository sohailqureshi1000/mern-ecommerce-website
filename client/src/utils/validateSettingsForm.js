export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 \-]{1,10}[A-Za-z0-9]$/;

export function normalizePhone(phone) {
  const trimmed = String(phone ?? '').trim();
  const compact = trimmed.replace(/[\s\-()]/g, '');
  const plus = compact.startsWith('+');
  const digits = compact.replace(/^\+/, '');
  return { plus, digits, compact };
}

export function isValidPhone(phone) {
  const { compact } = normalizePhone(phone);
  return /^\+?\d{10,15}$/.test(compact);
}

export function isValidEmail(email) {
  return EMAIL_PATTERN.test(String(email ?? '').trim());
}

export function isPasswordChangeAttempt(values) {
  return Boolean(
    String(values?.password ?? '').length || String(values?.confirmPassword ?? '').length
  );
}

function shippingError(value, label) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return null;
  if (trimmed.length < 2) return `${label} looks too short.`;
  return null;
}

export function validateSettingsForm(values = {}, _options = {}) {
  const errors = {};
  const name = String(values.name ?? '').trim();
  const email = String(values.email ?? '').trim();
  const phone = String(values.phone ?? '').trim();

  if (!name) {
    errors.name = 'Enter your name.';
  }

  if (!email) {
    errors.email = 'Enter your email.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!phone) {
    errors.phone = 'Enter your phone number.';
  } else if (!isValidPhone(phone)) {
    errors.phone = 'Enter a valid phone number (10–15 digits).';
  }

  const streetMsg = shippingError(values.street, 'Street');
  if (streetMsg) errors.street = streetMsg;

  const cityMsg = shippingError(values.city, 'City');
  if (cityMsg) errors.city = cityMsg;

  const countryMsg = shippingError(values.country, 'Country');
  if (countryMsg) errors.country = countryMsg;

  const postalCode = String(values.postalCode ?? '').trim();
  if (postalCode && !POSTAL_PATTERN.test(postalCode)) {
    errors.postalCode = 'Enter a valid postal code.';
  }

  if (isPasswordChangeAttempt(values)) {
    const password = String(values.password ?? '');
    const confirmPassword = String(values.confirmPassword ?? '');
    const currentPassword = String(values.currentPassword ?? '');

    if (!password) {
      errors.password = 'Enter a new password.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!currentPassword) {
      errors.currentPassword = 'Enter your current password to change it.';
    }
  }

  return errors;
}
