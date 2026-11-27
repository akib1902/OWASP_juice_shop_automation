/**
 * API-004..API-007 + AUTH-008 — authentication and authorization.
 *
 * STRATEGY: the negative cases are the point. A login test that only proves the
 * happy path tells you the endpoint exists; proving that a bad password is
 * rejected and that an anonymous caller cannot read a basket tells you the
 * security boundary works.
 */
import { expect, test } from '../../src/fixtures/base.fixture.js';

test.describe('Authentication API', () => {
  test('API-004 login with valid credentials succeeds @smoke @api', async ({ api, customer }) => {
    const response = await api.auth.login(customer.email, customer.password);

    expect(response.status).toBe(200);
    expect(response.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/); // JWT: header.payload.signature
    expect(response.basketId).toBeTruthy();
    expect(response.email).toBe(customer.email);
  });

  test('API-005 login with invalid credentials is rejected', async ({ api, customer }) => {
    const response = await api.auth.login(customer.email, 'definitely-not-the-password');

    expect(response.status).toBe(401);
    expect(response.ok).toBe(false);
    expect(response.token).toBeUndefined();
    expect(String(response.body)).toContain('Invalid email or password');
  });

  test('API-006 authenticated request is authorized', async ({ api, customer }) => {
    const response = await api.basket.items(customer.token);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('API-007 request without authentication is rejected', async ({ api }) => {
    const response = await api.basket.items();

    expect(response.status).toBe(401);
    expect(response.body).not.toHaveProperty('data');
  });

  test('AUTH-008 protected resource without token is denied', async ({ api, customer }) => {
    // /rest/basket/{id} is scoped to the owning user. Without a token it must be
    // rejected — and with another user's token it must not leak their basket.
    const anonymous = await api.basket.basket(customer.basketId);
    expect(anonymous.status).toBe(401);

    const authenticated = await api.basket.basket(customer.basketId, customer.token);
    expect(authenticated.status).toBe(200);
    expect(authenticated.body.data.id).toBe(customer.basketId);
  });
});
