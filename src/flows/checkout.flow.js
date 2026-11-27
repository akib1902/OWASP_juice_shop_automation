/**
 * ============================================================================
 *  Business flows — higher-level verbs built from page objects
 * ============================================================================
 *
 *  WHY a flow layer on top of POM:
 *  A user journey ("buy this, then check my order history") spans several pages
 *  and several steps. Four order tests would otherwise repeat the same nine
 *  lines, and a change to the wizard would mean four edits. A flow says the
 *  journey once; page objects stay responsible for a single screen.
 *
 *  This is the layer most interviewers probe for: POM alone gives you reusable
 *  *pages*, not reusable *scenarios*.
 * ============================================================================
 */
import { newAddress } from '../utils/data.js';

/**
 * Seed the basket over the API so a checkout test does not spend its budget
 * clicking "Add to Basket". Arrangement is fast; the assertion is still UI.
 */
export async function seedBasket(api, user, items = [{ productId: 1, quantity: 1 }]) {
  const created = [];
  for (const item of items) {
    const id = await api.basket.addItemAndGetId({
      token: user.token,
      basketId: user.basketId,
      productId: item.productId,
      quantity: item.quantity ?? 1,
    });
    created.push(id);
  }
  return created;
}

/**
 * Walk the whole checkout wizard and return the created order id + the total
 * the UI showed. Assumes the basket already has items (see seedBasket).
 */
/**
 * A brand-new customer owns no payment method, so /#/payment/shop renders zero
 * options and the wizard dead-ends. Seeding a valid test card through the API is
 * arrangement for a step the order test is not about; the checkout walk itself
 * still happens in the browser.
 */
async function seedPaymentCard(api, user) {
  const response = await api.checkout.addCard({ token: user.token });
  if (!response.ok) {
    throw new Error(`Could not seed a payment card for ${user.email} (HTTP ${response.status})`);
  }
}

export async function completeCheckout(shop, address = newAddress()) {
  await seedPaymentCard(shop.api, shop.user);
  await shop.basket.goto();
  await shop.basket.expectLoaded();
  await shop.basket.goToCheckout();

  // A brand-new customer has no saved address; an existing one does. The flow —
  // not the test — decides which path applies. Tests stay branch-free.
  if (await shop.checkout.hasSavedAddress()) {
    await shop.checkout.selectFirstAddress();
  } else {
    await shop.checkout.addAddress(address);
  }

  await shop.checkout.continueToDelivery();
  await shop.checkout.selectFirstDeliveryMethod();
  await shop.checkout.continueToPayment();
  await shop.checkout.selectFirstPaymentMethod();
  await shop.checkout.continueToSummary();

  const total = await shop.checkout.summaryTotal();
  await shop.checkout.placeOrder();
  const orderId = await shop.checkout.orderId();

  return { orderId, total };
}
