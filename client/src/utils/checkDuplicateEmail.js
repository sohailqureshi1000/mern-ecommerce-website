const TAKEN_EMAILS = new Set(['taken@sohail.shop']);

/**
 * Stub duplicate-email check. Replace with a real API call when the backend
 * exposes a dedicated uniqueness endpoint.
 */
export async function checkDuplicateEmail(email) {
  const normalized = String(email ?? '').trim().toLowerCase();
  await Promise.resolve();
  return TAKEN_EMAILS.has(normalized);
}
