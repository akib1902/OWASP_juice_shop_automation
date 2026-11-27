/**
 * Login screen (AUTH-001..AUTH-005 UI side).
 *
 * Selectors verified in v20: #email, #password, #loginButton,
 * inline error rendered as `.error` ("Invalid email or password.").
 *
 * DESIGN NOTE: `login()` performs the interaction; `loginExpectingSuccess()`
 * bundles the interaction with the post-condition a caller almost always needs.
 * Tests stay one line and still assert, which is the point of a POM — it must
 * not become a set of action helpers whose outcomes are invisible.
 */
import { expect } from '@playwright/test';

import { routes } from '../constants/index.js';
import { BasePage } from './BasePage.js';

export class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('#loginButton');
    this.showPasswordToggle = page.getByRole('button', { name: /show password/i });
    this.errorMessage = page.locator('.error').first();
  }

  get path() {
    return routes.login;
  }

  async expectVisible() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  async fillCredentials(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.loginButton.click();
  }

  /** Full happy-path login; resolves once the app has left the login route. */
  async loginAs(email, password) {
    await this.fillCredentials(email, password);
    await this.submit();
    await expect(this.page).not.toHaveURL(/#\/login/);
  }

  /** Negative-path assertion shared by AUTH-003/004 (wrong password / wrong email). */
  async expectRejected(message = 'Invalid email or password.') {
    await expect(this.errorMessage).toContainText(message);
    await expect(this.page).toHaveURL(/#\/login/);
  }
}
