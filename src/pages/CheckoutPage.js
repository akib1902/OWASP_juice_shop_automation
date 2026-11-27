/**
 * Multi-step checkout (ORDER-001..ORDER-005).
 *
 * Juice Shop's checkout is a wizard: address -> delivery -> payment -> summary
 * -> order completion, each step a separate route. Three design decisions:
 *
 *  1. ONE PAGE OBJECT FOR THE WIZARD. The steps share state (the basket) and
 *     are meaningless in isolation; splitting them into four classes would
 *     force every test to know the step order twice.
 *
 *  2. EACH STEP METHOD ASSERTS ITS OWN ARRIVAL. `continueToDelivery()` waits for
 *     the delivery URL, so a broken transition fails at the transition rather
 *     than three steps later with a confusing "radio not found".
 *
 *  3. `continueButton` IS RESOLVED BY ROLE, NOT BY CSS. Angular Material gives
 *     each step a different id for the same "Continue" action; the accessible
 *     name is the stable contract. `.last()` picks the primary action because
 *     the wizard renders a "Back" control first.
 */
import { expect } from '@playwright/test';

import { messages, routes } from '../constants/index.js';
import { parsePrice } from '../utils/data.js';
import { BasePage } from './BasePage.js';

export class CheckoutPage extends BasePage {
  constructor(page) {
    super(page);
    this.addressRadios = page.locator('mat-radio-button');
    this.addNewAddressButton = page.locator('button[aria-label="Add New Address"]');
    // The wizard's primary action is the accessibility-name contract, but the
    // name changes per step ("Continue" on address, "Proceed to delivery method
    // selection" on delivery, and so on). One regex covers every step; `.last()`
    // skips the "Back" control that renders first.
    this.continueButton = page.getByRole('button', { name: /continue|proceed/i }).last();
    this.placeOrderButton = page.locator('#checkoutButton');
    this.validationErrors = page.locator('mat-error');
    this.submitAddressButton = page.locator('#submitButton');
    this.confirmationRoot = page.locator('app-order-completion');
    this.orderPlacedMessage = page.getByText(messages.orderPlaced);
  }

  get path() {
    return routes.addressSelect;
  }

  /** Address step: a saved address exists only for non-fresh accounts. */
  async hasSavedAddress() {
    return (await this.addressRadios.count()) > 0;
  }

  /**
   * Selecting a Material radio by its host element is unreliable (the host is not
   * the input), so the native input is checked and then verified via `toBeChecked`.
   * One helper, used by every wizard step — the trap is solved once.
   */
  async selectFirstAddress() {
    const radio = this.addressRadios.first();
    await radio.click();
    await expect(radio.locator('input')).toBeChecked();
  }

  /**
   * Create an address through the UI (exercises the real form, not the API).
   *
   * Fields are addressed by their Material labels, NOT by `name="ng.formN.x"`:
   * Angular auto-generates the form index, so the same field is `ng.form0.fullName`
   * on one visit and `ng.form1.fullName` on the next — a selector that silently
   * breaks when another form initialises earlier in the page. Labels are the
   * accessibility contract and stay put.
   */
  async addAddress(address) {
    await this.addNewAddressButton.click();
    await expect(this.page).toHaveURL(/#\/address\/create/);
    await this.page.getByLabel(/^name$/i).fill(address.fullName);
    await this.page.getByLabel(/^country$/i).fill(address.country);
    await this.page.getByLabel(/mobile number/i).fill(address.mobile);
    await this.page.getByLabel(/zip code/i).fill(address.zipCode);
    await this.page.getByLabel(/^address$/i).fill(address.street);
    await this.page.getByLabel(/^city$/i).fill(address.city);
    await this.page.getByLabel(/^state$/i).fill(address.state);

    await expect(this.submitAddressButton).toBeEnabled();
    await this.submitAddressButton.click();
    await expect(this.page).toHaveURL(/#\/address\/select/);
    await expect(this.addressRadios.first()).toBeVisible();
    await this.selectFirstAddress();
  }

  /**
   * ORDER-002: an incomplete address must not produce an order.
   *
   * On v20 validation is enforced by an invalid form: the Submit button is
   * disabled and the route does not change. Asserting "a red message appeared"
   * would encode a rendering choice; asserting "cannot submit + did not advance"
   * encodes the behaviour that actually protects the user.
   */
  async expectCannotSubmitIncompleteAddress() {
    await this.addNewAddressButton.click();
    await expect(this.page).toHaveURL(/#\/address\/create/);
    await expect(this.submitAddressButton).toBeDisabled();
    await expect(this.page).toHaveURL(/#\/address\/create/);
  }

  async continueToDelivery() {
    await expect(this.continueButton).toBeEnabled();
    await this.continueButton.click();
    await expect(this.page).toHaveURL(/#\/delivery-method/);
  }

  async selectFirstDeliveryMethod() {
    await this.selectFirstAddress();
  }

  async continueToPayment() {
    await expect(this.continueButton).toBeEnabled();
    await this.continueButton.click();
    await expect(this.page).toHaveURL(/#\/payment\/shop/);
  }

  async selectFirstPaymentMethod() {
    await this.selectFirstAddress();
  }

  async continueToSummary() {
    // The payment step renders "Continue" (primary) plus a wallet "Submit".
    if (await this.continueButton.isVisible().catch(() => false)) {
      await this.continueButton.click();
    } else {
      await this.page.locator('#submitButton').click();
    }
    await expect(this.page).toHaveURL(/#\/order-summary/);
  }

  /**
   * Total shown on the order summary. Parsed from the summary text rather than
   * from a deep CSS path: the number is the contract, the wrapper is decoration.
   *
   * Polls until the figure settles above zero: the summary route renders its
   * table skeleton first and fills the prices from the basket a moment later, so
   * a single read can legitimately capture 0 and make a correct order look wrong.
   */
  async summaryTotal() {
    let total = 0;
    await expect
      .poll(
        async () => {
          const text = await this.page.locator('body').innerText();
          // "Total Price" appears TWICE: once as the basket table's column header
          // (row line totals) and once as the grand total at the bottom of the
          // summary. Taking the first match reads an item's line total instead of
          // the order total — the last occurrence is the grand total.
          const matches = [...text.matchAll(/Total Price\s*:?\s*([\d.,]+)/gi)];
          total = matches.length ? parsePrice(matches.at(-1)[1]) : 0;
          return total;
        },
        { message: 'order summary total' },
      )
      .toBeGreaterThan(0);
    return total;
  }

  /** Final action. Resolves only when the confirmation screen is really up. */
  async placeOrder() {
    await this.placeOrderButton.click();
    await expect(this.page).toHaveURL(/#\/order-completion/);
    await expect(this.orderPlacedMessage).toBeVisible();
  }

  /**
   * Order id as shown on the confirmation screen. Read from the URL first
   * (authoritative, survives styling changes), then fall back to page text.
   */
  async orderId() {
    // The URL is authoritative — but capture the WHOLE final segment, not the
    // first `\w+` chunk, so a multi-segment id is not silently truncated.
    const fromUrl = this.page.url().match(/order-completion\/([^/?#]+)/i);
    if (fromUrl) return decodeURIComponent(fromUrl[1]);
    const body = await this.confirmationRoot.innerText();
    const fromBody = body.match(/([0-9a-z]+-[0-9a-z]{6,})/i);
    if (!fromBody)
      throw new Error(`Could not find an order id on the confirmation page:\n${body.slice(0, 300)}`);
    return fromBody[1];
  }
}
