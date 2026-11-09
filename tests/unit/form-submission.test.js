import test from 'node:test';
import assert from 'node:assert/strict';
import { submitStoredForm } from '../../src/js/services/form-submission.js';

test('structured API errors give readers a useful message rather than object coercion', async () => {
  for (const payload of [
    { detail: [{ msg: 'Invalid input' }] },
    { error: { code: 'unavailable' } },
  ]) {
    await assert.rejects(
      submitStoredForm(
        '/api/contact',
        {},
        {
          fetchImpl: async () => ({ ok: false, status: 422, json: async () => payload }),
        }
      ),
      { message: 'The form could not be saved. Please try again.' }
    );
  }
});
