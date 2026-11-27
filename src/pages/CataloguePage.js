/**
 * Product catalogue + search results (PROD-001..PROD-006).
 *
 * Verified structure (v20): one `<app-product>` per card; each card exposes
 *   - a `section[role="button"][aria-label="Click for more information about the product"]`
 *     that opens the details route,
 *   - a `button[aria-label="Add to Basket"]`.
 *
 * WHY filter-by-text instead of nth(index): the catalogue order is a server
 * concern and can change (it is seeded, then sorted). Filtering by the product
 * name makes the test independent of ordering — a test that breaks when a
 * product is added to the catalogue is a false alarm, not a finding.
 */
import { expect } from '@playwright/test';

import { routes } from '../constants/index.js';
import { BasePage } from './BasePage.js';
import { HeaderComponent } from '../components/HeaderComponent.js';

export class CataloguePage extends BasePage {
  constructor(page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.cards = page.locator('app-product');
    this.cardTitles = page.locator('app-product .product-name, app-product h2, app-product mat-card-title');
    this.searchHeading = page.getByText(/search results/i).first();
  }

  get path() {
    return routes.catalogue;
  }

  async expectLoaded() {
    await expect(this.cards.first()).toBeVisible();
    await expect.poll(() => this.cards.count()).toBeGreaterThan(0);
  }

  /** Card locator for one product, resolved by visible text (order-independent). */
  cardByName(name) {
    return this.cards.filter({ hasText: name }).first();
  }

  async addToBasket(name) {
    this.log.debug(`add to basket: ${name}`);
    const card = this.cardByName(name);
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Add to Basket' }).click();
  }

  /**
   * Open a product's details modal by clicking the card body.
   * Details is a dialog in v20 (URL unchanged), so we wait for the dialog rather
   * than for a route — waiting for a URL that never changes is the bug this
   * comment exists to prevent.
   */
  async openProduct(name) {
    const card = this.cardByName(name);
    await expect(card).toBeVisible();
    await card.locator('section[role="button"]').first().click();
    await expect(this.page.locator('mat-dialog-container app-product-details')).toBeVisible();
  }

  /**
   * Search through the header search bar (the app's real user journey).
   * Only the navigation is asserted here; whether results/heading rendered is a
   * separate concern (expectSearchResultsHeading / expectEmptyState), because a
   * hostile term can legitimately replace the heading and must not make the
   * search *interaction* look broken.
   */
  async search(term) {
    await this.header.search(term);
  }

  async expectSearchResultsHeading() {
    await expect(this.searchHeading).toBeVisible();
  }

  async expectResultCountAtLeast(count) {
    await expect
      .poll(() => this.cards.count(), { message: 'visible product cards' })
      .toBeGreaterThanOrEqual(count);
  }

  /**
   * Empty state: v20 renders the "Search Results - <term>" heading with zero
   * cards. We assert the heading BEFORE asserting zero, otherwise an unloaded
   * page would "pass" the empty-state check.
   */
  async expectEmptyState() {
    await this.expectSearchResultsHeading();
    await expect.poll(() => this.cards.count(), { message: 'product cards for unmatched search' }).toBe(0);
  }
}
