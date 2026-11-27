/**
 * Test data helpers.
 *
 * STRATEGY
 * --------
 * Tests must never share an account or a cart. The cheapest way to guarantee
 * that is to derive every identity from the clock + a random suffix:
 *
 *   qa.1732123456789.4821@juice-shop.test
 *
 * WHY the `.test` TLD: RFC 2606 reserves it for testing, so a misconfigured
 * mailer can never actually deliver to a real person if these addresses leak
 * into an environment.
 *
 * Data is generated in code (not fixtures) so a test can reason about the one
 * value it created — and it disappears with the test run.
 */
export const uniqueSuffix = () =>
  `${Date.now()}.${Math.floor(Math.random() * 10_000)
    .toString()
    .padStart(4, '0')}`;

export const uniqueEmail = (prefix = 'qa') => `${prefix}.${uniqueSuffix()}@juice-shop.test`;

/** Parses the app's currency format ("1.99¤") into a number. */
export const parsePrice = (text) => {
  const match = String(text)
    .replace(',', '.')
    .match(/-?\d+(\.\d+)?/);
  if (!match) throw new Error(`No price found in "${text}"`);
  return Number(match[0]);
};

/** Two decimal "money" comparison: avoids float equality traps (0.1+0.2). */
export const sameMoney = (a, b) => Math.abs(Number(a) - Number(b)) < 0.005;

/** Default checkout address used by the order tests. */
export const newAddress = () => ({
  fullName: 'Qa Automation',
  country: 'Germany',
  mobile: '1234567890',
  zipCode: '10115',
  city: 'Berlin',
  state: 'Berlin',
  street: 'Test Street 1',
});
