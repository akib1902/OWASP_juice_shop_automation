/**
 * API-001..API-003, API-008 — product read model and its contract.
 *
 * STRATEGY: these tests are the fastest gate in the pipeline (no browser), so
 * they carry the contract assertions. They would also be the first thing to run
 * against a new deployment to prove it is alive.
 */
import { expect, test } from '../../src/fixtures/base.fixture.js';
import { products } from '../../src/constants/index.js';
import { productListSchema, productSchema } from '../../src/schemas/index.js';
import { validateAgainstSchema } from '../../src/utils/schema.js';

test.describe('Products API', () => {
  test('API-001 retrieve product list returns HTTP 200 @smoke @api', async ({ api }) => {
    const response = await api.products.list();

    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
    expect(Array.isArray(response.body?.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test('API-002 retrieve product by id returns that product', async ({ api }) => {
    const response = await api.products.getById(products.appleJuice.id);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: products.appleJuice.id,
      name: products.appleJuice.name,
      price: products.appleJuice.price,
    });
  });

  test('API-003 invalid product id returns an appropriate error', async ({ api }) => {
    // Two shapes of "invalid": a well-formed id that does not exist, and a
    // non-numeric id. Both must be client errors, never a 500 and never a 200.
    const missing = await api.products.getById(999_999);
    expect(missing.status).toBe(404);
    expect(missing.body).toMatchObject({ message: 'Not Found' });

    const malformed = await api.products.getById('not-a-number');
    expect(malformed.status).toBe(404);
    expect(malformed.ok).toBe(false);
  });

  test('API-008 product JSON schema is respected for every item', async ({ api }) => {
    const response = await api.products.list();

    const envelopeErrors = validateAgainstSchema(productListSchema, response.body);
    expect(envelopeErrors, `envelope schema: ${envelopeErrors.join(', ')}`).toEqual([]);

    // Validate every product, not just the first: a single bad row is exactly
    // what a "first item only" assertion would miss.
    for (const product of response.body.data) {
      const errors = validateAgainstSchema(productSchema, product);
      expect(errors, `product ${product.id} schema: ${errors.join(', ')}`).toEqual([]);
    }
  });
});
