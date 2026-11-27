/**
 * Basket screen (CART-001..CART-006).
 *
 * Verified structure (v20): `app-basket mat-row` rows; the product name lives in
 * `mat-cell.mat-column-product`; the quantity cell contains Material icon
 * buttons whose FontAwesome svg carries `data-icon="minus-square"` /
 * `"plus-square"`, plus a delete button.
 *
 * WHY icon selectors by `data-icon` instead of nth(index): index-based selectors
 * break the moment the app adds a column. The FontAwesome data attribute is
 * semantic, stable, and readable.
 *
 * Totals are read as text and parsed to numbers here, never in the test — money
 * parsing in a spec is noise, and 0.1+0.2 float traps belong in one helper.
 */
import { expect } from '@playwright/test';

import { routes, messages } from '../constants/index.js';
import { parsePrice } from '../utils/data.js';
import { SnackbarComponent } from '../components/SnackbarComponent.js';
import { BasePage } from './BasePage.js';

export class BasketPage extends BasePage {
  constructor(page) {
    super(page);
    this.snackbar = new SnackbarComponent(page);
    this.root = page.locator('app-basket');
    this.rows = page.locator('app-basket mat-row');
    this.checkoutButton = page.locator('#checkoutButton');
    this.emptyMessage = page.getByText(/basket is empty|no items/i);
  }

  get path() {
    return routes.basket;
  }

  /**
   * Arrive at the basket with no toast covering the first row.
   * The snackbar from "add to basket" survives the route change, and its
   * animation can sit over the quantity/remove buttons for a moment.
   */
  async goto(path = this.path) {
    await super.goto(path);
    await this.snackbar.dismissIfVisible();
  }

  /**
   * The shell being ready is NOT the basket being loaded: rows arrive from
   * `/rest/basket/{id}` afterwards. Waiting for the heading (which renders even
   * for an empty basket) is the honest "basket view is up" signal, so a caller
   * that immediately counts rows cannot read a stale zero.
   */
  async expectLoaded() {
    await expect(this.root).toBeVisible();
    await expect(this.root.getByText(/your basket/i).first()).toBeVisible();
    await expect(this.checkoutButton).toBeVisible();
  }

  rowByProduct(name) {
    return this.rows.filter({ hasText: name }).first();
  }

  async productNames() {
    return (await this.rows.locator('mat-cell.mat-column-product').allInnerTexts())
      .map((t) => t.trim())
      .filter(Boolean);
  }

  async expectContainsProducts(names) {
    for (const name of names) {
      await expect(this.rowByProduct(name), `basket row for ${name}`).toBeVisible();
    }
  }

  async count() {
    return this.rows.count();
  }

  async addToBasketFromCatalogue(catalogue, name) {
    await catalogue.addToBasket(name);
    await this.snackbar.waitForMessage(messages.addedToBasket);
  }

  /** Quantity as displayed for one row. */
  async quantityOf(name) {
    const cell = this.rowByProduct(name).locator('mat-cell.mat-column-quantity');
    const text = (await cell.innerText()).replace(/\s+/g, ' ').trim();
    const digit = text.match(/\d+/);
    return digit ? Number(digit[0]) : Number.NaN;
  }

  async increaseQuantity(name) {
    await this.rowByProduct(name).locator('button:has(svg[data-icon="plus-square"])').first().click();
  }

  async decreaseQuantity(name) {
    await this.rowByProduct(name).locator('button:has(svg[data-icon="minus-square"])').first().click();
  }

  async removeProduct(name) {
    const row = this.rowByProduct(name);
    await expect(row).toBeVisible();
    await row.locator('button:has(svg[data-icon^="trash"]), button').last().click();
    await expect(this.rowByProduct(name)).toHaveCount(0);
  }

  /** Parsed "Total Price: 1.99¤" from the basket summary. */
  async total() {
    const text = await this.root.innerText();
    const match = text.match(/Total Price:?\s*([\d.,]+\s*¤)/i);
    if (!match) throw new Error(`No total price found in basket text:\n${text.slice(0, 400)}`);
    return parsePrice(match[1]);
  }

  async expectTotal(expected) {
    await expect.poll(() => this.total(), { message: 'basket total' }).toBeCloseTo(expected, 2);
  }

  async goToCheckout() {
    await this.checkoutButton.click();
    await expect(this.page).toHaveURL(/#\/address\/select/);
  }
}
