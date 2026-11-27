/**
 * Registration screen (AUTH-005, AUTH-006).
 *
 * Selectors verified in v20:
 *   #emailControl, #passwordControl, #repeatPasswordControl,
 *   #securityQuestionControl (mat-select), #securityAnswerControl, #registerButton.
 *
 * The security question is a Material select: its options are rendered in a
 * CDK overlay *outside* the form, so it must be clicked and then resolved from
 * the overlay (`mat-option`) — a classic Angular Material trap that this page
 * object encapsulates once.
 */
import { expect } from '@playwright/test';

import { routes } from '../constants/index.js';
import { BasePage } from './BasePage.js';

export class RegisterPage extends BasePage {
  constructor(page) {
    super(page);
    this.emailInput = page.locator('#emailControl');
    this.passwordInput = page.locator('#passwordControl');
    this.repeatPasswordInput = page.locator('#repeatPasswordControl');
    this.securityQuestionSelect = page.locator('#securityQuestionControl');
    this.securityAnswerInput = page.locator('#securityAnswerControl');
    this.registerButton = page.locator('#registerButton');
    this.errorMessage = page.locator('.error').first();
    // The strength meter only appears while typing — used as a "form reacted" signal.
    this.passwordStrength = page.locator('mat-password-strength, mat-password-strength-info');
  }

  get path() {
    return routes.register;
  }

  async expectVisible() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  /**
   * Open the Material select and choose an option.
   *
   * The retry block is deliberate: a click that lands while Angular is still
   * settling (right after typing into the password fields) can be swallowed and
   * leave the overlay closed — a failure mode that looks like "no options exist"
   * and costs 30s of timeout to diagnose. Retrying only the *opening* keeps the
   * option choice single and intentional.
   */
  async selectSecurityQuestion(text) {
    const options = this.page.locator('mat-option');
    const trigger = this.securityQuestionSelect.locator('.mat-mdc-select-trigger');

    await expect(async () => {
      if ((await options.count()) === 0) await trigger.click();
      await expect(options.first()).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 10_000 });

    const option = text ? options.filter({ hasText: text }).first() : options.first();
    await option.click();
    await expect(options.first()).toHaveCount(0);
  }

  /** Fill the whole form. `submit: false` lets a test assert validation first. */
  async fillForm({ email, password, securityAnswer = 'qa-answer' }, { submit = true } = {}) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.repeatPasswordInput.fill(password);
    await this.selectSecurityQuestion();
    await this.securityAnswerInput.fill(securityAnswer);
    if (submit) await this.registerButton.click();
  }

  /**
   * A successful registration redirects to the login route with a snackbar.
   * The redirect (not the toast) is asserted because it is the durable outcome:
   * toasts are cosmetic and auto-dismiss.
   */
  async registerExpectingSuccess(data) {
    await this.fillForm(data);
    await expect(this.page).toHaveURL(/#\/login/);
  }

  async expectRejected() {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.page).toHaveURL(/#\/register/);
  }
}
