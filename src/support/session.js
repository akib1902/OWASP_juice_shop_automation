/**
 * Building a browser session from an API token.
 *
 * WHY this exists: Juice Shop keeps its JWT twice — a `token` cookie (read by
 * the cookie service) and `localStorage.token` (read by the Angular user
 * service). Setting only one leaves the UI "anonymous" even though the API
 * accepts the token. Verified empirically against v20; documented here so the
 * next person does not repeat the investigation.
 *
 * The result is a Playwright `storageState` object, which means a test context
 * can start already signed in without a single UI login (~2s saved per test)
 * and without a shared on-disk auth file (which breaks isolation under parallel
 * workers).
 */
import { env } from '../config/env.js';

/**
 * Seed the cookies Juice Shop itself writes when a user dismisses its first-run
 * overlays. Applied to EVERY context the framework creates (the default one and
 * each authenticated `session`), because a modal left open makes Angular mark
 * the rest of the app `aria-hidden` — which Playwright reports as "hidden" and
 * which silently breaks clicks in unrelated tests.
 */
export async function suppressFirstRunOverlays(context, baseURL = env.baseURL) {
  const { hostname } = new URL(baseURL);
  await context.addCookies([
    { name: 'welcomebanner_status', value: 'dismiss', domain: hostname, path: '/' },
    { name: 'cookieconsent_status', value: 'dismiss', domain: hostname, path: '/' },
    { name: 'language', value: 'en', domain: hostname, path: '/' },
  ]);
  return context;
}

/**
 * Complete a browser session for a customer whose token came from the API.
 *
 * WHY this exists on top of storageState: Playwright's storageState can only
 * carry cookies and **localStorage**. Juice Shop keeps the user's basket id in
 * **sessionStorage.bid** (verified on v20), so a context restored from a token
 * alone is "logged in" but asks the server for `/rest/basket/0` — silently
 * breaking every cart and checkout action. addInitScript runs before the app
 * bootstraps on each navigation, which is the only place sessionStorage can be
 * seeded for a new context.
 */
export async function authenticateContext(context, { token, basketId }) {
  await context.addInitScript(
    ({ jwt, bid }) => {
      window.localStorage.setItem('token', jwt);
      if (bid !== undefined && bid !== null) window.sessionStorage.setItem('bid', String(bid));
    },
    { jwt: token, bid: basketId },
  );
  return context;
}

export function storageStateFor(token, baseURL = env.baseURL) {
  if (!token) throw new Error('storageStateFor() needs a token');
  const url = new URL(baseURL);
  return {
    cookies: [
      {
        name: 'token',
        value: token,
        domain: url.hostname,
        path: '/',
        expires: -1,
        httpOnly: false,
        secure: url.protocol === 'https:',
        sameSite: 'Lax',
      },
    ],
    origins: [{ origin: url.origin, localStorage: [{ name: 'token', value: token }] }],
  };
}
