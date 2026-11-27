/**
 * CART-001..CART-006 — basket behaviour.
 *
 * STRATEGY
 * --------
 *  - These tests mutate server-side state, so they run with the `shop` fixture:
 *    a brand-new customer per test means a brand-new empty basket. That is what
 *    allows them to run in parallel instead of being forced into a serial file.
 *  - Assertion target is the *user-visible effect* (snackbar, badge, row, total),
 *    cross-checked against the API where the number matters (CART-004/005).
 *  - Money is compared with `toBeCloseTo`, never `toBe`: 2 * 1.99 must not fail
 *    on a binary float artefact.
 */
import { expect, test } from '../../src/fixtures/base.fixture.js';
import { messages, products } from '../../src/constants/index.js';
import { parsePrice } from '../../src/utils/data.js';

test.describe('Shopping cart @cart', () => {
  test('CART-001 adding a product puts it in the basket @smoke', async ({ shop }) => {
    await shop.catalogue.goto();
    await shop.catalogue.addToBasket(products.appleJuice.name);

    await shop.snackbar.waitForMessage(messages.addedToBasket);
    await shop.header.expectBasketCount(1);

    await shop.basket.goto();
    await shop.basket.expectContainsProducts([products.appleJuice.name]);
  });

  test('CART-002 adding multiple products shows all of them', async ({ shop }) => {
    await shop.catalogue.goto();
    await shop.catalogue.addToBasket(products.appleJuice.name);
    await shop.snackbar.waitForMessage(messages.addedToBasket);
    // Banana Juice, not Orange Juice: the catalogue paginates at 15 items and
    // Orange Juice is on page 2 — a test that pages would be testing pagination,
    // not the cart. (See products.bananaJuice in src/constants.)
    await shop.catalogue.addToBasket(products.bananaJuice.name);
    await shop.snackbar.waitForMessage(/Placed .*Banana Juice.* into basket/i);

    await shop.basket.goto();
    await shop.basket.expectContainsProducts([products.appleJuice.name, products.bananaJuice.name]);
    await expect.poll(() => shop.basket.count()).toBe(2);
  });

  test('CART-003 removing a product deletes only that row', async ({ shop }) => {
    await shop.catalogue.goto();
    await shop.catalogue.addToBasket(products.appleJuice.name);
    await shop.snackbar.waitForMessage(messages.addedToBasket);
    await shop.catalogue.addToBasket(products.bananaJuice.name);
    await shop.snackbar.waitForMessage(/Placed .*Banana Juice.* into basket/i);

    await shop.basket.goto();
    await shop.basket.removeProduct(products.appleJuice.name);

    await expect.poll(() => shop.basket.productNames()).toEqual([products.bananaJuice.name]);
  });

  test('CART-004 cart contents match what the API reports', async ({ shop, api }) => {
    await shop.catalogue.goto();
    await shop.catalogue.addToBasket(products.appleJuice.name);
    await shop.snackbar.waitForMessage(messages.addedToBasket);
    await shop.catalogue.addToBasket(products.bananaJuice.name);
    await shop.snackbar.waitForMessage(/Placed .*Banana Juice.* into basket/i);

    await shop.basket.goto();
    await shop.basket.expectLoaded();

    // Cross-check: the UI and the API must agree about the user's basket. A UI
    // test that only checks "a row exists" cannot see a stale-cache bug.
    // NOTE: the API client is used with an explicit bearer token on purpose —
    // Juice Shop authorises with the JWT header, not the session cookie, so
    // `context.request` (cookie-based) would get a 401 HTML page here.
    const response = await api.basket.basket(shop.user.basketId, shop.user.token);
    const apiNames = response.body.data.Products.map((p) => p.name).sort();

    // Poll, because the basket table renders asynchronously after the route.
    await expect
      .poll(async () => (await shop.basket.productNames()).sort(), { message: 'UI rows vs API basket' })
      .toEqual(apiNames);
  });

  test('CART-005 cart quantity updates when the quantity is increased', async ({ shop, api }) => {
    await shop.catalogue.goto();
    await shop.catalogue.addToBasket(products.appleJuice.name);
    await shop.snackbar.waitForMessage(messages.addedToBasket);

    await shop.basket.goto();
    await shop.basket.increaseQuantity(products.appleJuice.name);

    await expect
      .poll(() => shop.basket.quantityOf(products.appleJuice.name), { message: 'row quantity' })
      .toBe(2);

    // The API is the source of truth for the stored quantity.
    const response = await api.basket.basket(shop.user.basketId, shop.user.token);
    const item = response.body.data.Products.find((p) => p.id === products.appleJuice.id);
    expect(item.BasketItem.quantity).toBe(2);
  });

  test('CART-006 cart total equals sum of (price x quantity)', async ({ shop }) => {
    await shop.catalogue.goto();
    await shop.catalogue.addToBasket(products.appleJuice.name);
    await shop.snackbar.waitForMessage(messages.addedToBasket);
    await shop.catalogue.addToBasket(products.bananaJuice.name);
    await shop.snackbar.waitForMessage(/Placed .*Banana Juice.* into basket/i);

    await shop.basket.goto();
    await shop.basket.increaseQuantity(products.appleJuice.name);
    await expect.poll(() => shop.basket.quantityOf(products.appleJuice.name)).toBe(2);

    const expected = products.appleJuice.price * 2 + products.bananaJuice.price;
    await expect.poll(() => shop.basket.total(), { message: 'displayed total' }).toBeCloseTo(expected, 2);
    expect(parsePrice(`${expected}¤`)).toBeCloseTo(expected, 2);
  });
});
