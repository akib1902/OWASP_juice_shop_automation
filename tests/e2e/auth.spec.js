/**
 * AUTH-001..AUTH-007 — the UI half of authentication.
 * (AUTH-008, the token-less access check, lives in tests/api/auth.api.spec.js
 *  because it is an HTTP authorisation concern, not a browser one.)
 *
 * STRATEGY
 * --------
 *  - Every test starts from a known page (`goto`) and asserts its own outcome;
 *    nothing depends on the previous test having run.
 *  - Positive cases reuse the `customer` fixture (registered via API, so the
 *    *login* is what is under test — not the registration form).
 *  - Negative cases assert both the message AND that we did not move off the
 *    login route: "stayed put" is the actual security property.
 */
import { expect, test } from '../../src/fixtures/base.fixture.js';
import { messages } from '../../src/constants/index.js';
import { uniqueEmail } from '../../src/utils/data.js';

test.describe('Authentication @auth', () => {
  test('AUTH-001 login page appears @smoke', async ({ app }) => {
    await app.login.goto();

    await app.login.expectVisible();
    await app.login.expectOnPage(/#\/login/);
  });

  test('AUTH-002 login with valid credentials authenticates the user', async ({ app, customer }) => {
    await app.login.goto();
    await app.login.loginAs(customer.email, customer.password);

    await expect.poll(() => app.header.isLoggedIn(), { message: 'session token stored' }).toBe(true);
    await app.header.expectVisible();
  });

  test('AUTH-003 login with an invalid password is rejected', async ({ app, customer }) => {
    await app.login.goto();
    await app.login.fillCredentials(customer.email, 'wrong-password-123');
    await app.login.submit();

    await app.login.expectRejected(messages.loginFailed);
    await expect.poll(() => app.header.isLoggedIn()).toBe(false);
  });

  test('AUTH-004 login with an unknown email is rejected', async ({ app, customer }) => {
    await app.login.goto();
    await app.login.fillCredentials(uniqueEmail('ghost'), customer.password);
    await app.login.submit();

    await app.login.expectRejected(messages.loginFailed);
    await expect.poll(() => app.header.isLoggedIn()).toBe(false);
  });

  test('AUTH-005 registering a new account creates a usable account', async ({ app }) => {
    const email = uniqueEmail('newuser');
    const password = 'P@ssw0rd!123';

    await app.register.goto();
    await app.register.expectVisible();
    await app.register.registerExpectingSuccess({ email, password });
    await app.snackbar.waitForMessage(messages.registered);

    // "Account created" is only meaningful if the account can then authenticate.
    await app.login.loginAs(email, password);
    await expect.poll(() => app.header.isLoggedIn()).toBe(true);
  });

  test('AUTH-006 registering a duplicate email is rejected', async ({ app, customer }) => {
    await app.register.goto();
    await app.register.fillForm({ email: customer.email, password: 'P@ssw0rd!123' });

    await app.register.expectRejected();
  });

  test('AUTH-007 logout ends the session', async ({ app, customer }) => {
    await app.login.goto();
    await app.login.loginAs(customer.email, customer.password);
    await expect.poll(() => app.header.isLoggedIn()).toBe(true);

    await app.header.logout();

    await expect.poll(() => app.header.isLoggedIn(), { message: 'token cleared' }).toBe(false);
    // A logged-out user must be pushed back to a public page, not left on a
    // protected one with a stale UI.
    await expect(app.header.accountButton).toBeVisible();
  });
});
