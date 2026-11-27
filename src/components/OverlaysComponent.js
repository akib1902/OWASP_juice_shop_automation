/**
 * Overlays: the welcome modal and the cookie banner.
 *
 * WHY this is a component and not a line in each page object: both overlays are
 * shown once per browser profile, but they *intercept clicks* while visible, so
 * forgetting one produces a 30s "element is not clickable" timeout instead of a
 * useful failure. Centralising dismissal makes it impossible to forget.
 *
 * Known Juice Shop quirk (v20): the welcome banner is a Material dialog with a
 * `Close Welcome Banner` aria-label; the cookie bar is an `a` with
 * `dismiss cookie message`. Both are optional by design, so the helpers are
 * idempotent and never fail when the overlay is already gone.
 */
import { expect } from '@playwright/test';

import { createLogger } from '../support/logger.js';

const log = createLogger('overlays');

export class OverlaysComponent {
  constructor(page) {
    this.page = page;
    this.welcomeDialog = page
      .locator('mat-dialog-container')
      .filter({ has: page.locator('app-welcome-banner') });
    this.closeWelcomeButton = page.locator('button[aria-label="Close Welcome Banner"]');
    this.dismissCookieButton = page.locator('a[aria-label="dismiss cookie message"]');
  }

  async dismissWelcome() {
    const button = this.closeWelcomeButton.first();
    if (!(await button.isVisible().catch(() => false))) return false;
    log.debug('dismissing welcome banner');
    await button.click();
    await expect(this.welcomeDialog).toHaveCount(0);
    return true;
  }

  async dismissCookieBanner() {
    const button = this.dismissCookieButton.first();
    if (!(await button.isVisible().catch(() => false))) return false;
    log.debug('dismissing cookie banner');
    await button.click();
    await expect(this.dismissCookieButton).toHaveCount(0);
    return true;
  }

  /** Called from BasePage.goto so every navigation starts from a clean surface. */
  async dismissAll() {
    await this.dismissWelcome();
    await this.dismissCookieBanner();
  }
}
