/**
 * The application header: search, account menu, basket counter.
 *
 * WHY a component object (a "page fragment"): the header is rendered on every
 * route. Modelling it once and *composing* it into pages — rather than copying
 * `page.locator('#navbarAccount')` into eight page objects — is the single
 * biggest maintenance win of POM. If the header markup changes, this file is
 * the only one that changes.
 *
 * Selectors are verified against Juice Shop v20 (see docs/STRATEGY.md §selectors):
 *   #navbarAccount, button[aria-label="Show the shopping cart"],
 *   button[aria-label="Open search"], #searchQuery (a DIV wrapper!) > input,
 *   menu items are <a aria-label="Logout"> inside .mat-mdc-menu-panel.
 */
import { expect } from '@playwright/test';

import { createLogger } from '../support/logger.js';

const log = createLogger('header');

export class HeaderComponent {
  constructor(page) {
    this.page = page;
    this.toolbar = page.locator('mat-toolbar:visible').first();
    this.searchToggle = page.locator('button[aria-label="Open search"]');
    this.searchInput = page.locator('#searchQuery input');
    this.basketButton = page.locator('button[aria-label="Show the shopping cart"]');
    this.accountButton = page.locator('#navbarAccount');
    this.accountMenu = page.locator('.mat-mdc-menu-panel').first();
    // The account menu's logout is a BUTTON with id navbarLogoutButton. There is
    // also an `a[aria-label="Logout"]` — but that one lives in the sidenav and is
    // permanently hidden, so clicking it times out. Verified against v20.
    this.logoutItem = page.locator('#navbarLogoutButton');
    this.sidenavToggle = page.locator('button[aria-label="Open Sidenav"]');
  }

  /** The header is the shell's liveness probe: visible => Angular bootstrapped. */
  async expectVisible() {
    await expect(this.toolbar).toBeVisible();
  }

  /** Basket badge text is "Your Basket 3"; we assert on the number, not the label. */
  async basketCount() {
    const text = await this.basketButton.innerText();
    const match = text.match(/Basket\s*(\d+)/i);
    return match ? Number(match[1]) : 0;
  }

  async expectBasketCount(expected) {
    await expect.poll(() => this.basketCount(), { message: 'basket badge count' }).toBe(expected);
  }

  async openAccountMenu() {
    await this.accountButton.click();
    await expect(this.accountMenu).toBeVisible();
  }

  async isLoggedIn() {
    // localStorage is the app's own source of truth for the session; reading it
    // is faster and less brittle than opening a menu to look for "Logout".
    return Boolean(await this.page.evaluate(() => window.localStorage.getItem('token')));
  }

  async logout() {
    log.debug('logging out');
    await this.openAccountMenu();
    await this.logoutItem.click();
    await expect.poll(() => this.isLoggedIn(), { message: 'token cleared after logout' }).toBe(false);
  }

  /**
   * Search through the real UI (PROD-003/004/005).
   * NOTE: `#searchQuery` is the expanding wrapper div in v20 — the actual
   * `<input>` is its child, which is why the selector is `#searchQuery input`.
   */
  async search(term) {
    if (!(await this.searchInput.isVisible().catch(() => false))) {
      await this.searchToggle.click();
    }
    await expect(this.searchInput).toBeVisible();
    await this.searchInput.fill(term);
    await this.searchInput.press('Enter');
    await expect(this.page).toHaveURL(
      new RegExp(`/search\\?q=${encodeURIComponent(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    );
  }

  async openBasket() {
    await this.basketButton.click();
    await expect(this.page).toHaveURL(/#\/basket/);
  }
}
