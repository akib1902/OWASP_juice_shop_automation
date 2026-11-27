/**
 * ORDER-001..ORDER-005 — checkout and order history.
 *
 * STRATEGY
 * --------
 *  - Arrangement over HTTP (`seedBasket`), exercise over UI, verify over API.
 *    This "hybrid" pattern keeps each test focused on the step it is proving and
 *    is the reason this whole file runs in seconds rather than minutes.
 *  - Each test owns its customer, so each owns its order. No test depends on
 *    another test's order id — that dependency is the #1 cause of "passes alone,
 *    fails in the suite".
 *  - The order id is the shared key between UI and API, which is what makes
 *    ORDER-005 a genuine cross-layer check rather than a second smoke test.
 */
import { expect, test } from '../../src/fixtures/base.fixture.js';
import { delivery, products } from '../../src/constants/index.js';
import { completeCheckout, seedBasket } from '../../src/flows/checkout.flow.js';
import { newAddress } from '../../src/utils/data.js';

test.describe('Orders @orders', () => {
  test('ORDER-001 proceeding to checkout opens the checkout page', async ({ shop, api }) => {
    await seedBasket(api, shop.user, [{ productId: products.appleJuice.id }]);

    await shop.basket.goto();
    await shop.basket.goToCheckout();

    await shop.checkout.expectOnPage(/#\/address\/select/);
  });

  test('ORDER-002 checkout without an address shows validation', async ({ shop, api }) => {
    await seedBasket(api, shop.user, [{ productId: products.appleJuice.id }]);

    await shop.basket.goto();
    await shop.basket.goToCheckout();

    // A fresh customer has no address, so the wizard cannot advance: the empty
    // form must be rejected (Submit disabled) instead of creating an order.
    await shop.checkout.expectCannotSubmitIncompleteAddress();

    await shop.checkout.expectOnPage(/#\/address\/create/);
  });

  test('ORDER-003 a valid checkout creates an order', async ({ shop, api }) => {
    const items = [
      { productId: products.appleJuice.id, quantity: 2 },
      { productId: products.orangeJuice.id, quantity: 1 },
    ];
    await seedBasket(api, shop.user, items);

    const { orderId, total } = await completeCheckout(shop, newAddress());

    expect(orderId).toBeTruthy();
    // The flow selects the first delivery option, so the order total is
    // items + delivery. Forgetting the delivery line is the classic way to write
    // a "correct" assertion that fails against a correct application.
    const itemsTotal = products.appleJuice.price * 2 + products.orangeJuice.price;
    expect(total).toBeCloseTo(itemsTotal + delivery.oneDay.price, 2);
  });

  test('ORDER-004 a placed order appears in order history', async ({ shop, api }) => {
    await seedBasket(api, shop.user, [{ productId: products.appleJuice.id, quantity: 1 }]);
    const { orderId } = await completeCheckout(shop);

    await shop.orders.goto();

    await shop.orders.expectLoaded();
    await shop.orders.expectOrderVisible(orderId);
    expect(await shop.orders.visibleOrderIds()).toContain(orderId);
  });

  test('ORDER-005 order details returned by the API match the checkout', async ({ shop, api }) => {
    await seedBasket(api, shop.user, [{ productId: products.appleJuice.id, quantity: 3 }]);
    const { orderId, total } = await completeCheckout(shop);

    const order = await api.orders.findByOrderId(shop.user.token, orderId);

    expect(order, `order ${orderId} should be returned by /rest/order-history`).toBeTruthy();
    expect(order.totalPrice).toBeCloseTo(total, 2);
    expect(order.products.map((p) => p.name)).toContain(products.appleJuice.name);
    expect(order.products.find((p) => p.name === products.appleJuice.name).quantity).toBe(3);
  });
});
