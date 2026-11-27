/**
 * Product details (PROD-002).
 *
 * IMPORTANT: in Juice Shop v20 the details view is a **modal dialog**
 * (`mat-dialog-container app-product-details`) rendered over the catalogue — the
 * URL does not change and `/#/product/{id}` just shows the catalogue. A page
 * object written against the old route-based assumption silently times out on
 * `app-product-details`, so the modal is modelled explicitly here.
 *
 * STRATEGY: assert on identifying content (name + price), not on a title element
 * — the title markup is the most likely thing to be restyled, while the product
 * name and price are the contract the user actually cares about.
 */
import { expect } from '@playwright/test';

import { routes } from '../constants/index.js';
import { parsePrice } from '../utils/data.js';
import { BasePage } from './BasePage.js';

export class ProductDetailsPage extends BasePage {
  constructor(page) {
    super(page);
    // Scoping every locator to the dialog prevents a stray catalogue card from
    // satisfying an assertion meant for the details view.
    this.dialog = page.locator('mat-dialog-container').filter({ has: page.locator('app-product-details') });
    this.root = page.locator('mat-dialog-container app-product-details');
    this.closeButton = page.locator('mat-dialog-container button[aria-label="Close Dialog"]');
    this.heading = this.dialog.getByRole('heading', { level: 1 });
    this.reviewInput = page.locator('mat-dialog-container input[placeholder*="like or dislike" i]');
    this.reviewSubmit = page.locator('mat-dialog-container #submitButton');
  }

  /** Overlay, not a route: opening it starts from the catalogue. */
  get path() {
    return routes.catalogue;
  }

  async expectVisible() {
    await expect(this.dialog).toBeVisible();
    await expect(this.root).toBeVisible();
  }

  /**
   * Assert the dialog is showing THIS product.
   * The heading role is used instead of a CSS class: it is an accessibility
   * contract, so it survives restyling — and it proves the modal is about the
   * product we clicked, not merely that "a" dialog opened.
   */
  async expectProduct(name, price) {
    await expect(this.heading).toHaveText(name);
    await expect(this.root).toContainText(name);
    if (price !== undefined) {
      const text = await this.root.innerText();
      const priceText = text.match(/[\d.,]+\s*¤/)?.[0];
      expect(parsePrice(priceText ?? text)).toBeCloseTo(price, 2);
    }
  }

  async close() {
    await this.closeButton.click();
    await expect(this.dialog).toHaveCount(0);
  }
}
