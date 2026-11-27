/**
 * API-009 — error-response contract.
 *
 * WHY this deserves its own test: error bodies are the part of an API everyone
 * forgets, and the part integrations depend on most. Juice Shop really does emit
 * three shapes, and pinning them is the point of the test:
 *
 *   404 unknown API resource  -> application/json  { message, errors[] }
 *   401 missing/invalid token -> application/json  { error: { message, name, status } }
 *   401 bad login             -> text/html         plain "Invalid email or password."
 *
 * A uniform "expect 4xx" assertion would pass while a client's JSON parser broke.
 */
import { expect, test } from '../../src/fixtures/base.fixture.js';
import { errorSchema, unauthorizedSchema } from '../../src/schemas/index.js';
import { validateAgainstSchema } from '../../src/utils/schema.js';
import { messages } from '../../src/constants/index.js';

test.describe('Error contract', () => {
  test('API-009 error responses match the error JSON schema', async ({ api }) => {
    const notFound = await api.products.getById(999_999);
    expect(notFound.status).toBe(404);
    expect(notFound.headers['content-type'] ?? '').toContain('application/json');
    expect(validateAgainstSchema(errorSchema, notFound.body)).toEqual([]);

    // `Accept: application/json` is sent by the client, which is why an
    // unauthenticated API call answers JSON instead of the browser's HTML page.
    const unauthenticated = await api.basket.items();
    expect(unauthenticated.status).toBe(401);
    expect(validateAgainstSchema(unauthorizedSchema, unauthenticated.body)).toEqual([]);
    expect(unauthenticated.body.error.status).toBe(401);
  });

  test('API-005b invalid login explains itself in the response body', async ({ api }) => {
    const response = await api.auth.login('nobody@juice-shop.test', 'wrong-password');

    expect(response.status).toBe(401);
    expect(response.text).toContain(messages.loginFailed);
    // The login route answers HTML even when JSON is requested. Documenting it
    // here means a client is never surprised by "Unexpected token < in JSON".
    expect(response.headers['content-type'] ?? '').toContain('text/html');
  });
});
