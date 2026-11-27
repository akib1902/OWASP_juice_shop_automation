/**
 * ============================================================================
 *  BasePage — the contract every page object inherits
 * ============================================================================
 *
 *  STRATEGY
 *  --------
 *  1. EVERY page object owns ONE screen and exposes *intent* ("loginAs",
 *     "addToBasket"), never raw selectors. If a test says
 *     `page.click('#loginButton')`, the POM has failed: the test now knows
 *     markup it should not know, and a UI change breaks tests instead of
 *     breaking one page object.
 *
 *  2. NAVIGATION IS A TEMPLATE METHOD.
 *     `goto()` goes -> waits for the app shell -> clears blocking overlays.
 *     Subclasses only declare `path`. Nobody forgets the overlay step because
 *     nobody writes the goto themselves.
 *
 *  3. NO HARD WAITS. Auto-waiting + web-first assertions only. A `sleep()`
 *     hides the real timing problem and turns a fast failure into a slow one.
 *
 *  4. LOCATORS ARE PROJECTIONS, NOT HANDLES.
 *     `this.cards` is a locator (a query), not an element. It re-resolves on
 *     every use, so a re-render or a route change cannot leave us holding a
 *     detached element — the classic "stale element" failure of Selenium-style
 *     frameworks.
 * ============================================================================
 */
import { expect } from '@playwright/test';

import { OverlaysComponent } from '../components/OverlaysComponent.js';
import { createLogger } from '../support/logger.js';

export class BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.overlays = new OverlaysComponent(page);
    this.log = createLogger(this.constructor.name);
  }

  /** Each page object must declare its route. Fail loudly if it forgets. */
  get path() {
    throw new Error(`${this.constructor.name} must implement a "path" getter`);
  }

  /** Root Angular element: present as soon as the app bootstrapped. */
  get appRoot() {
    return this.page.locator('app-root');
  }

  /** Navigate with the shell-ready + overlays-cleared guarantees built in. */
  async goto(path = this.path) {
    this.log.debug(`goto ${path}`);
    await this.page.goto(path);
    await this.waitForAppReady();
  }

  /**
   * "Ready" means: the app shell is rendered AND nothing is covering it.
   *
   * WHY the retry block: Angular Material marks the rest of the application
   * `aria-hidden` while a modal (the first-run welcome banner) is open, which
   * Playwright reports as "hidden". Dismissing a modal that appears a moment
   * after load therefore has to be retried until the toolbar really is visible —
   * `expect.toPass()` does that with auto-waiting instead of a sleep.
   */
  async waitForAppReady() {
    await expect(this.appRoot).toBeAttached();
    await expect(async () => {
      await this.overlays.dismissAll();
      // `:visible` matters: Juice Shop renders more than one <mat-toolbar>, and
      // the first in DOM order is an offscreen 0x0 element. Selecting the
      // *visible* toolbar is the difference between a real readiness probe and a
      // locator that can never pass.
      await expect(this.page.locator('mat-toolbar:visible').first()).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15000 });
  }

  /** Assert we are on the expected route. Prefer this over raw URL strings. */
  async expectOnPage(pathOrRegExp) {
    await expect(this.page).toHaveURL(pathOrRegExp);
  }
}
