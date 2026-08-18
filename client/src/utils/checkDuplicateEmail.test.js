import { describe, expect, it } from 'vitest';
import { checkDuplicateEmail } from './checkDuplicateEmail.js';

describe('checkDuplicateEmail', () => {
  it('flags the stub duplicate address', async () => {
    await expect(checkDuplicateEmail('taken@sohail.shop')).resolves.toBe(true);
    await expect(checkDuplicateEmail('  TAKEN@sohail.shop  ')).resolves.toBe(true);
  });

  it('allows an unused address', async () => {
    await expect(checkDuplicateEmail('sohail@example.com')).resolves.toBe(false);
  });
});
