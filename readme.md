# Juice Shop Playwright Framework (JavaScript + Page Object Model)

A production-shaped end-to-end and API test framework for [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/),
written in plain JavaScript against Playwright Test.

It covers the 33 cases in `test cases.md` (AUTH / CART / PROD / ORDER / API) and is built so that the
_structure_, not just the assertions, is defensible in a code review or an interview.

```
Playwright 1.6x · Node 18+ · ESM · ESLint (flat) + Prettier · Ajv schema contracts · POM + components + flows
```

---

## Quick start

```bash
# 1. Start the application under test
docker run --rm -p 3000:3000 bkimminich/juice-shop

# 2. Install and verify reachability
npm install
npx playwright install chromium firefox webkit
npm run check:env

# 3. Run
npm test                # everything (all projects)
npm run test:api        # API only, no browser (~5s)
npm run test:e2e        # UI projects
npm run test:smoke      # @smoke tagged subset
npm run report          # open the HTML report
```

Configuration lives in `.env` (copy from `.env.example`). Every value has a safe default, so the suite
runs unmodified against `http://localhost:3000`.

---

## What is where

```
playwright.config.js         projects, reporters, retries, artifacts
src/
  config/env.js              one place that resolves + validates configuration
  constants/index.js         routes, seeded products, delivery prices, copy
  api/                       BaseApiClient + Auth / Products / Basket / Checkout / Orders clients
  pages/                     one page object per screen (+ BasePage)
  components/                Header, Snackbar, Overlays (shared fragments)
  flows/                     business flows composed from page objects (checkout)
  fixtures/base.fixture.js   custom fixtures: api, customer, session, app, shop
  support/                   logger, session/auth-state helpers
  utils/                     data generation, money parsing, JSON-schema validation
  schemas/                   product / product-list / error / unauthorized contracts
tests/
  api/                       API-001..API-009 (+ AUTH-008)
  e2e/                       AUTH-*, CART-*, PROD-*, ORDER-*
scripts/check-env.js         pre-flight reachability check
MILESTONES.md                phased delivery plan (M0..M6)
docs/STRATEGY.md             the "why" behind every decision (interview notes)
docs/TEST-PLAN.md            traceability matrix: test case -> spec -> status
```

---

## The five ideas the framework is built on

1. **Page objects own screens; tests own intent.** A test never sees a selector. `shop.basket.removeProduct(name)`
   is the whole vocabulary; `mat-cell.mat-column-quantity` appears exactly once, in `BasketPage`.
2. **Components for things that appear everywhere.** The header, snackbar and first-run overlays are modelled
   once and reused, instead of being re-located in eight page objects.
3. **Fixtures own the world.** `customer` registers a throw-away account over the API, `session` starts a real
   browser context for it, `shop` hands back page objects plus the user who owns the state. Every test is
   isolated, so the suite can run `fullyParallel`.
4. **Arrange over HTTP, assert in the browser.** Registering a user, seeding a basket and adding a payment card
   are API calls; the behaviour under test stays UI-driven. This is why the whole UI suite runs in ~30s.
5. **No sleeps, no conditionals in tests, no `nth-child`.** Web-first assertions, role/label locators, and
   `expect.poll` where a value settles asynchronously.

Details and trade-offs: [`docs/STRATEGY.md`](docs/STRATEGY.md).

---

## Test inventory

| Area                 | Cases                       | Spec                             |
| -------------------- | --------------------------- | -------------------------------- |
| Authentication (UI)  | AUTH-001 … AUTH-007         | `tests/e2e/auth.spec.js`         |
| Authentication (API) | AUTH-008, API-004 … API-007 | `tests/api/auth.api.spec.js`     |
| Cart                 | CART-001 … CART-006         | `tests/e2e/cart.spec.js`         |
| Catalogue / search   | PROD-001 … PROD-006         | `tests/e2e/catalogue.spec.js`    |
| Checkout / orders    | ORDER-001 … ORDER-005       | `tests/e2e/orders.spec.js`       |
| Products API         | API-001 … API-003, API-008  | `tests/api/products.api.spec.js` |
| Error contracts      | API-009, API-005b           | `tests/api/contract.api.spec.js` |

Full matrix with status: [`docs/TEST-PLAN.md`](docs/TEST-PLAN.md).

---

## Commands

| Command                                  | What it does                               |
| ---------------------------------------- | ------------------------------------------ |
| `npm test`                               | all projects, all specs                    |
| `npm run test:api` / `test:e2e`          | single layer                               |
| `npm run test:smoke` / `test:regression` | tag selection                              |
| `npm run test:headed`                    | visible browser                            |
| `npm run test:ui` / `test:debug`         | Playwright UI mode / inspector             |
| `npm run report` / `test:trace`          | HTML report / trace viewer                 |
| `npm run lint` / `format`                | ESLint (incl. Playwright rules) / Prettier |
| `npm run check:env`                      | is the app reachable?                      |

---

## Application quirks this framework encodes

Juice Shop v20 differs from most tutorials; the framework handles these so tests stay readable:

- **Details are a modal**, not a route: `/#/product/1` renders the catalogue, so `ProductDetailsPage` models a dialog.
- **Two auth stores**: the JWT lives in `localStorage.token` _and_ a `token` cookie; the **basket id lives in
  `sessionStorage.bid`**, which Playwright's `storageState` cannot carry — so `authenticateContext()` seeds it
  with an init script.
- **The header renders two `mat-toolbar`s**; the first is an offscreen 0×0 element. Readiness checks use
  `mat-toolbar:visible`.
- **First-run overlays** (welcome dialog + cookie bar) are suppressed by seeding the cookies the app writes;
  while such a modal is open, Angular marks the app `aria-hidden` and Playwright reports everything as hidden.
- **The catalogue paginates at 15 items**, so tests use products that are actually on page one.
- **The address form's `name` attributes are auto-generated** (`ng.form0.fullName` / `ng.form1.fullName`), so
  fields are addressed by their Material labels instead.
- **Three error shapes**: `{message, errors}` for 404, `{error:{…}}` for 401, and HTML for a bad login.
- **The SUT is intentionally insecure.** PROD-005 asserts the app stays usable after hostile input; it does
  _not_ assert XSS-safety, because that would be asserting the app is not Juice Shop. The reflection is a known,
  deliberate vulnerability — a finding to report, not a failing test.

---

## CI

`.github/workflows/playwright.yml` starts Juice Shop as a service container, runs the API gate first, then the
Chromium suite sharded 2×, and uploads `reports/` (HTML, JUnit, JSON, traces). Firefox/WebKit run on a nightly
schedule so cross-browser coverage does not slow down every commit.
