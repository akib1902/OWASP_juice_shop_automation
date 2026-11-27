/**
 * Order history (ORDER-004).
 *
 * v20 renders orders as stacked cards inside `app-order-history .orders-container`
 * with the id printed as "#5267-0df454ef30e71f63". Assertions target that id
 * text, which is the same identifier the API returns — that shared key is what
 * makes a UI <-> API cross-check (ORDER-005) meaningful.
 */
import { expect } from '@playwright/test';

import { routes } from '../constants/index.js';
import { BasePage } from './BasePage.js';

export class OrderHistoryPage extends BasePage {
  constructor(page) {
    super(page);
    this.root = page.locator('app-order-history');
    // Order ids look like "5267-0df454ef30e71f63" or "c630-d272a093fb96a8c4":
    // either segment can start with a letter, so the pattern must not assume a
    // leading digit (a digit-only pattern silently finds nothing).
    this.orderIds = page.locator('app-order-history').getByText(/#[0-9a-z]+-[0-9a-z]+/i);
    this.noOrdersMessage = page.getByText(/no orders|order history is empty/i);
  }

  get path() {
    return routes.orderHistory;
  }

  async expectLoaded() {
    await expect(this.root).toBeVisible();
  }

  /** @returns {Promise<string[]>} every order id visible, without the leading '#'. */
  async visibleOrderIds() {
    const texts = await this.orderIds.allInnerTexts();
    return [...new Set(texts.map((t) => t.replace('#', '').trim()).filter(Boolean))];
  }

  async expectOrderVisible(orderId) {
    await expect(this.root.getByText(new RegExp(`#?${orderId}`)).first()).toBeVisible();
  }
}
