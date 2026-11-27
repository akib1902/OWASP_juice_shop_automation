/**
 * Material snackbar ("Placed Apple Juice (1000ml) into basket.").
 *
 * WHY wait-not-assert semantics: the snackbar is the app's success signal, but
 * it auto-dismisses after ~4s. Reading `innerText()` immediately after a click
 * is a race. `waitForMessage` uses a web-first assertion that polls until the
 * text appears *or* the expect timeout expires — deterministic without a sleep.
 */
import { expect } from '@playwright/test';

export class SnackbarComponent {
  constructor(page) {
    this.page = page;
    // v20 renders mat-snack-bar-container > simple-snack-bar. Asserting on the
    // container (the stable outer element) rather than a nested label avoids a
    // locator that disappears the instant Material re-renders the toast.
    this.container = page.locator('mat-snack-bar-container').first();
  }

  async waitForMessage(matcher, timeout = 10_000) {
    await expect(this.container).toContainText(matcher, { timeout });
    return this.container;
  }

  /**
   * Clear a toast that is still on screen.
   *
   * WHY it matters: the snackbar survives client-side navigation and sits above
   * the content at the bottom of the viewport. A row button underneath it can be
   * covered by the animation for a moment, and the first click then lands on the
   * toast — which is exactly the "clicked but nothing happened" flake seen on
   * WebKit. Clearing it deterministically is cheaper than retrying the click.
   */
  async dismissIfVisible() {
    if ((await this.container.count()) === 0) return false;
    const action = this.container.getByRole('button').first();
    if (await action.isVisible().catch(() => false)) await action.click();
    await expect(this.container).toHaveCount(0);
    return true;
  }

  async dismiss() {
    const action = this.container.getByRole('button').first();
    if (await action.isVisible().catch(() => false)) await action.click();
    await expect(this.container).toHaveCount(0);
  }
}

