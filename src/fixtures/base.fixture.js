/**
 * ============================================================================
 *  Custom fixtures — how tests get their world
 * ============================================================================
 *
 *  STRATEGY
 *  --------
 *  1. FIXTURES OVER before/after HOOKS.
 *     A fixture declares *what* a test needs; Playwright builds only that, and
 *     tears it down even when the test fails. Hooks are order-dependent and
 *     leak state between tests. This is dependency injection for tests.
 *
 *  2. EVERY TEST GETS A BRAND-NEW CUSTOMER, VIA THE API.
 *     `customer` registers a unique account over HTTP (~50ms) and logs in, so
 *     the basket/order state a test mutates belongs to nobody else. That is what
 *     makes `fullyParallel: true` in playwright.config.js safe. Registering
 *     through the UI would cost ~2s per test and prove nothing new.
 *
 *  3. THE SESSION IS A REAL BROWSER CONTEXT, NOT A SHARED FILE.
 *     `session` builds storageState from that customer's token (cookie +
 *     localStorage) and gives the test its own context. No global auth state
 *     file means no cross-test contamination and no "works when run alone".
 *
 *  4. TWO BUNDLES, ONE SHAPE.
 *     `app`  = page objects on the anonymous page (login/register/catalogue).
 *     `shop` = page objects on the authenticated page + the user who owns it.
 *     A test reads either as `app.checkout` / `shop.basket`.
 * ============================================================================
 */
import { test as base, expect } from '@playwright/test';

import { createApiClients } from '../api/index.js';
import { env } from '../config/env.js';
import { pages } from '../pages/index.js';
import { authenticateContext, storageStateFor, suppressFirstRunOverlays } from '../support/session.js';
import { uniqueEmail } from '../utils/data.js';

export const test = base.extend({
  /* ---------------------------------------------------------------------
   * Pre-suppress the app's one-time overlays.
   *
   * WHY at context level rather than clicking them away in every test: the
   * welcome modal and cookie bar are gated by cookies, and while a modal is open
   * Angular marks the rest of the app `aria-hidden` — clicks inside it would be
   * intercepted. Seeding the same cookies the app itself writes makes every test
   * start on a clean surface in ~0ms. OverlaysComponent remains the fallback for
   * a genuinely fresh browser profile.
   * ------------------------------------------------------------------- */
  context: async ({ context }, use) => {
    await suppressFirstRunOverlays(context);
    await use(context);
  },

  /* ---------------------------------------------------------------------
   * API clients — available to every test and to other fixtures.
   * ------------------------------------------------------------------- */
  api: async ({ request }, use) => {
    await use(createApiClients(request));
  },

  /* ---------------------------------------------------------------------
   * A disposable, verified customer.
   * scope: 'test' is the default and is exactly what we want: a new user per
   * test, never shared across workers.
   * ------------------------------------------------------------------- */
  customer: async ({ api }, use) => {
    const email = uniqueEmail('customer');
    const password = env.defaultPassword;

    const registered = await api.auth.register({ email, password });
    if (!registered.ok) {
      throw new Error(`Fixture setup failed: could not register ${email} (HTTP ${registered.status})`);
    }

    const login = await api.auth.loginOrThrow(email, password);
    await use({
      email,
      password,
      id: registered.body?.data?.id,
      token: login.token,
      basketId: login.basketId,
    });
  },

  /* ---------------------------------------------------------------------
   * Authenticated browser context + page.
   * ------------------------------------------------------------------- */
  session: async ({ browser, customer }, use) => {
    const context = await browser.newContext({
      baseURL: env.baseURL,
      storageState: storageStateFor(customer.token),
      viewport: { width: 1440, height: 900 },
    });
    // A hand-built context does NOT inherit the `context` fixture override, so
    // the first-run overlay cookies must be applied here too.
    await suppressFirstRunOverlays(context);
    // storageState covers cookies + localStorage; sessionStorage.bid needs an
    // init script or the basket resolves to id 0 (see support/session.js).
    await authenticateContext(context, customer);
    const page = await context.newPage();
    try {
      await use({ context, page, user: customer });
    } finally {
      // Always close: leaked contexts keep workers alive and CI jobs hanging.
      await context.close();
    }
  },

  /* ---------------------------------------------------------------------
   * Anonymous page-object bundle.
   * ------------------------------------------------------------------- */
  app: async ({ page }, use) => {
    await use(pages(page));
  },

  /* ---------------------------------------------------------------------
   * Authenticated page-object bundle.
   * ------------------------------------------------------------------- */
  shop: async ({ session, api }, use) => {
    // The bundle carries the API client too: checkout prerequisites (payment
    // card, address) are seeded over HTTP by the flow, not clicked into place.
    await use({ ...pages(session.page), session, user: session.user, api });
  },
});

export { expect };
