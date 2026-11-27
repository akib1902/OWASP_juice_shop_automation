/**
 * Route + domain constants.
 *
 * WHY a constants file: a route string like '/#/order-history' appearing in
 * six specs is six chances to typo it. Routes are an application contract, so
 * they live in one place — if the app renames a route, one line changes.
 *
 * Juice Shop is an Angular hash-router SPA: every screen is '#/<route>'.
 */
export const routes = Object.freeze({
  home: '/#/',
  login: '/#/login',
  register: '/#/register',
  catalogue: '/#/search',
  search: (term) => `/#/search?q=${encodeURIComponent(term)}`,
  product: (id) => `/#/product/${id}`,
  basket: '/#/basket',
  addressSelect: '/#/address/select',
  addressCreate: '/#/address/create',
  deliveryMethod: '/#/delivery-method',
  payment: '/#/payment/shop',
  orderSummary: '/#/order-summary',
  orderHistory: '/#/order-history',
  orderCompletion: /\/#\/order-completion\//,
});

/**
 * Stable domain data used by assertions.
 * These are seeded by Juice Shop and do not change between runs, which makes
 * them safe to assert on (unlike ids of rows a test itself created).
 */
export const products = Object.freeze({
  appleJuice: { id: 1, name: 'Apple Juice (1000ml)', price: 1.99 },
  orangeJuice: { id: 2, name: 'Orange Juice (1000ml)', price: 2.99 },
  pineappleJuice: { id: 3, name: 'Pineapple Juice (1000ml)', price: 2.99 },
  // Present on the first catalogue page (1000ml is page size 15) — used when a
  // test needs a second on-screen product without paging.
  bananaJuice: { id: 9, name: 'Banana Juice (1000ml)', price: 1.99 },
});

/** Copy the app renders. Asserted on rather than duplicated as raw strings in specs. */
/** Delivery options offered by the wizard, in render order. The checkout flow
 * selects the first one (`oneDay`), so order totals include its price. */
export const delivery = Object.freeze({
  oneDay: { name: 'One Day Delivery', price: 0.99 },
  fast: { name: 'Fast Delivery', price: 0.5 },
  standard: { name: 'Standard Delivery', price: 0 },
});

export const messages = Object.freeze({
  loginFailed: 'Invalid email or password.',
  addedToBasket: /Placed .+ into basket/i,
  registered: /Registration completed successfully/i,
  orderPlaced: /Thank you for your purchase/i,
});
