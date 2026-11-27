# Strategy notes — the "why" behind the framework

This document is the reasoning layer: what each decision buys, what it costs, and how to talk about it in a
review or an interview. Code comments cover the local details; this covers the architecture.

---

## 1. Layering

```
tests/            intent + assertions          "login with a bad password is rejected"
  flows/          multi-screen journeys        "complete a checkout"
    pages/        one screen each              "the basket shows these rows"
      components/ shared fragments             "the header's search box"
        support/  infrastructure               transport, session, logging
```

**Why four layers and not two.** POM alone gives reusable _pages_, not reusable _scenarios_. Adding a thin flow
layer means the nine-step checkout exists once, and the three order tests read as one line each. The rule of
thumb: if two tests repeat a sequence of three or more page-object calls, it belongs in `flows/`.

**Why not a "God" base page.** `BasePage` only knows navigation, readiness and overlays. Everything else lives in
the page object that owns the screen. Inheritance is one level deep on purpose — deep hierarchies make a change
at the root ripple everywhere.

---

## 2. Locator strategy (highest priority first)

1. `getByRole` with an accessible name — the app's own accessibility contract.
2. `getByLabel` for form fields — survives Angular's auto-generated `name="ng.formN.x"` attributes.
3. Stable ids the app ships (`#loginButton`, `#checkoutButton`, `#submitButton`).
4. Structural/semantic CSS (`app-product mat-row`, `svg[data-icon="plus-square"]`) scoped to a component.
5. Never: `nth-child`, absolute XPath, text of translatable labels, or a CSS path that encodes layout.

**Why `:visible` matters here.** Juice Shop renders two `mat-toolbar` elements; the first is 0×0 and hidden.
`.first()` on `mat-toolbar` therefore selects an invisible element and every readiness assertion fails with
"hidden" — a failure that looks like the app is broken. `mat-toolbar:visible` is the honest selector.

**Why not `data-testid`.** Juice Shop ships none. Adding test ids to an application you do not own is not an
option, so the framework leans on roles/labels, which is a better habit anyway.

---

## 3. Waiting model

- Auto-waiting handles actionability; `expect` handles state. Neither needs a sleep.
- `expect.poll(fn)` is used where the _value_ settles asynchronously (basket rows after the route renders,
  order summary total after prices load, header basket badge after an add).
- `expect.toPass()` is used where the _sequence_ must be retried (dismissing a modal that may appear a moment
  after load, opening a Material select whose first click can be swallowed).
- Hard waits appear nowhere. `eslint-plugin-playwright` enforces that (`no-wait-for-timeout`).
- Timeouts are layered: per-action 15s, per-assertion 10s, per-test 60s. A hung step fails before the job does.

---

## 4. Isolation and parallelism

`fullyParallel: true` is only safe because of the fixture design:

- `customer` registers a **new** account per test (unique email, `.test` TLD) and logs in over the API.
- `session` gives that customer its **own browser context**, so cookies/localStorage/sessionStorage cannot leak.
- Cart and order tests therefore mutate a basket nobody else can see. No `test.describe.serial`, no ordering
  dependencies, no "run this file alone" workarounds.

Cost: the SUT accumulates test users. M5.2 (cleanup sweeper) is the planned answer; leaving them is acceptable
for a local demo target but would be a real issue against a shared environment.

---

## 5. Hybrid testing (API arrange, UI assert)

| Step                         | Channel                 | Why                                                           |
| ---------------------------- | ----------------------- | ------------------------------------------------------------- |
| Register a customer          | API                     | 50ms vs ~2s; not the behaviour under test                     |
| Seed a basket                | API                     | the cart test is about the cart, not about clicking add twice |
| Add a payment card           | API                     | otherwise the payment step has zero options and dead-ends     |
| Login                        | UI (only in AUTH specs) | the login flow _is_ the behaviour under test                  |
| Checkout, cart edits, search | UI                      | these are the behaviours the suite exists to verify           |
| Verify totals / order data   | API                     | cross-layer: UI and API must agree                            |

This is the single biggest runtime win, and it also produces stronger tests: a UI assertion plus an API
cross-check catches stale-cache bugs that a UI-only test cannot see.

---

## 6. Assertions

- Assert **behaviour**, not markup: "the order is in history", not "mat-row 3 exists".
- One logical assertion per test (several `expect` calls are fine when they describe the same outcome).
- `toBeCloseTo` for money. `2 * 1.99` must not fail on a float artefact.
- Negative tests assert the _security property_: rejection message **and** "we are still on the login route"
  **and** "no token was stored".
- Assertions live in page objects only when they are the post-condition of an action
  (`expectRejected`, `expectCannotSubmitIncompleteAddress`); everything else stays in the spec.

---

## 7. Test data

- Generated, never shared: `qa.<timestamp>.<rand>@juice-shop.test`.
- Seeded domain constants (product names/prices, delivery prices) live in `src/constants` and are asserted on.
- No fixtures of "10 users" checked into the repo: a fixed account is shared mutable state, and shared state is
  how parallel suites become flaky.
- Money parsing and money comparison are centralised in `src/utils/data.js` — spec-level parsing is noise.

---

## 8. Failure forensics

- Trace on first retry, screenshot only on failure, video retained on failure. Tracing every run is slow and
  fills disks with data nobody reads.
- Reporters: `list`/`dot` for humans, `html` for triage, `junit` for CI ingestion, `json` for trend jobs.
- Every page object logs through a namespaced logger; `DEBUG_LOGS=header,api npm test` narrows output without
  touching code.

---

## 9. Flake policy

1. A test that only passes on retry is a **bug in the test or the framework**, logged in `docs/FLAKES.md`.
2. Retries exist for infrastructure noise (a dropped connection in CI), not for logic.
3. Locally retries are 0 so flakes are felt; CI uses 2 so a release is not blocked by noise.
4. Before "fixing" a flake with a longer timeout, prove the wait condition is wrong — usually the code is waiting
   for the shell when it should wait for data (see `BasketPage.expectLoaded`).

---

## 10. Configuration and secrets

- Tests never read `process.env`; `src/config/env.js` is the only reader and validates at import time.
- Precedence: real env var > `.env` > safe default. CI overrides without code changes.
- `.env` is ignored; `.env.example` documents every key. No credential is ever asserted on or logged.
- Accounts that ship with the SUT (admin) are configuration, not constants sprinkled through specs.

---

## 11. Known SUT quirks (hard-won, worth repeating)

| Quirk                                                              | Consequence                                                   | Handling                                                               |
| ------------------------------------------------------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Details view is a **modal**, `/#/product/{id}` shows the catalogue | route-based details object times out                          | `ProductDetailsPage` models `mat-dialog-container app-product-details` |
| JWT in `localStorage.token` **and** `token` cookie                 | cookie-only session is "anonymous" for the UI                 | `storageStateFor()` sets both                                          |
| Basket id in `sessionStorage.bid`                                  | token-only context calls `/rest/basket/0`, adds silently fail | `authenticateContext()` init script                                    |
| Welcome modal sets `aria-hidden` on the app                        | everything reports "hidden" while it is open                  | cookies seeded + `expect.toPass()` dismissal                           |
| Two `mat-toolbar` elements, first hidden                           | `.first()` never becomes visible                              | `:visible`                                                             |
| Catalogue paginates at 15                                          | second-page product is "not found"                            | on-page products in constants                                          |
| Address inputs named `ng.formN.*`                                  | selector breaks between visits                                | `getByLabel`                                                           |
| Payment step lists **zero** options for a new user                 | wizard dead-ends                                              | seed a card over the API                                               |
| Search reflects input unsanitised (intentional XSS)                | a "no XSS" assertion can never pass                           | assert usability/recovery; report the reflection as a finding          |

---

## 12. What I would do next, and why

1. **Cleanup sweeper** (M5.2) — the only real cost of per-test users.
2. **Accessibility gate** (M5.4) — cheap, and it doubles as a locator-quality check.
3. **Visual baselines** (M5.5) — only for the two screens where layout _is_ the product (catalogue card, basket row).
4. **Sharding + nightly matrix** (M6.1/M6.2) — after the suite is stable, not before.
