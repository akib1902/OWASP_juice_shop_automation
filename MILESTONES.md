# Delivery plan — milestones and sub-milestones

A framework is a long-run asset: the goal is not "tests exist", it is "the next engineer can add a test in ten
minutes and trust the result in CI". The plan below sequences that outcome. Each sub-milestone has a
deliverable and an acceptance check, so progress is verifiable rather than narrative.

Status legend: **[done]** implemented and verified against Juice Shop v20 · **[next]** planned, not built.

---

## M0 — Foundation (environment + tooling) [done]

| Sub-milestone            | Deliverable                                                                          | Acceptance                                                       |
| ------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| M0.1 Repo skeleton       | `package.json` (ESM, engines), `.gitignore`, `.editorconfig`-equivalent via Prettier | `npm install` clean                                              |
| M0.2 Configuration layer | `src/config/env.js`, `.env.example`                                                  | no `process.env` outside config; bad `BASE_URL` fails at startup |
| M0.3 Quality gates       | ESLint flat config + `eslint-plugin-playwright`, Prettier                            | `npm run lint` / `format:check` pass                             |
| M0.4 Playwright config   | 4 projects (api, chromium, firefox, webkit, mobile), reporters, retries              | `npx playwright test --list` discovers all specs                 |
| M0.5 Pre-flight          | `scripts/check-env.js`                                                               | fails loudly with the docker command when the app is down        |

## M1 — Core framework (POM + fixtures) [done]

| Sub-milestone          | Deliverable                                                         | Acceptance                                    |
| ---------------------- | ------------------------------------------------------------------- | --------------------------------------------- |
| M1.1 `BasePage`        | navigation template, shell-ready wait, overlay handling             | every page object inherits one `goto()`       |
| M1.2 Components        | `HeaderComponent`, `SnackbarComponent`, `OverlaysComponent`         | header search/logout reuse one implementation |
| M1.3 Page objects      | Login, Register, Catalogue, Details, Basket, Checkout, OrderHistory | no selector outside `src/`                    |
| M1.4 Fixtures          | `api`, `customer`, `session`, `app`, `shop`                         | new user per test; parallel-safe              |
| M1.5 Session bootstrap | cookie + `localStorage` + `sessionStorage.bid`                      | authenticated context without a UI login      |
| M1.6 Flow layer        | `flows/checkout.flow.js` (`seedBasket`, `completeCheckout`)         | checkout written once, used by 3 order tests  |

## M2 — API layer and contracts [done]

| Sub-milestone  | Deliverable                                                      | Acceptance                                       |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------------ |
| M2.1 Transport | `BaseApiClient` (URL join, auth header, never throws on 4xx/5xx) | negative tests read status/body                  |
| M2.2 Clients   | Auth, Products, Basket, Checkout, Orders                         | each endpoint documented with its verified shape |
| M2.3 Schemas   | product, product-list, error, unauthorized                       | `$ref` between schemas resolves                  |
| M2.4 Suite     | API-001..003, 008, 009, 004..007, AUTH-008                       | 11 pass in ~5s                                   |

## M3 — UI suites mapped to the test-case document [done]

| Sub-milestone       | Deliverable    | Acceptance                                                |
| ------------------- | -------------- | --------------------------------------------------------- |
| M3.1 Authentication | AUTH-001..007  | positive + negative paths, logout clears session          |
| M3.2 Catalogue      | PROD-001..006  | details modal, search hit/miss, hostile input, navigation |
| M3.3 Cart           | CART-001..006  | add/remove/multi-row, API cross-check, quantity, total    |
| M3.4 Orders         | ORDER-001..005 | validation, full checkout, history, API cross-check       |

## M4 — CI and reporting [done]

| Sub-milestone     | Deliverable                                                      | Acceptance                              |
| ----------------- | ---------------------------------------------------------------- | --------------------------------------- |
| M4.1 Pipeline     | GitHub Actions: Juice Shop service, API gate, sharded Chromium   | workflow runs on PR                     |
| M4.2 Artifacts    | html + junit + json reporters, trace on first retry              | failure is diagnosable without a re-run |
| M4.3 Tag strategy | `@smoke` / `@api` / `@cart` / `@orders` / `@catalogue` / `@auth` | `--grep` selections work                |

## M5 — Hardening (next)

| Sub-milestone           | Deliverable                                                      | Acceptance                               |
| ----------------------- | ---------------------------------------------------------------- | ---------------------------------------- |
| M5.1 Flake ledger       | `docs/FLAKES.md`, every retry-only pass logged with a root cause | no silent retries                        |
| M5.2 Data cleanup       | sweeper job that archives/deletes test users after a run         | SUT user table does not grow unbounded   |
| M5.3 Contract snapshots | store last-known-good schema versions, diff on failure           | breaking API changes named in the report |
| M5.4 Accessibility      | `@axe-core/playwright` on catalogue, basket, checkout            | serious/critical violations gated        |
| M5.5 Visual checks      | screenshot assertions for catalogue card + basket row            | baseline reviewed, not auto-accepted     |

## M6 — Scale (next)

| Sub-milestone                 | Deliverable                                         | Acceptance                              |
| ----------------------------- | --------------------------------------------------- | --------------------------------------- |
| M6.1 Sharding strategy        | `--shard` matrix, documented balancing by file      | wall-clock under 3 min for full UI      |
| M6.2 Nightly matrix           | firefox + webkit + mobile-chrome on schedule        | cross-browser regressions caught weekly |
| M6.3 Performance budget       | navigation timings via CDP/`performance.timing`     | thresholds in `docs/STRATEGY.md`        |
| M6.4 Component-level tests    | Playwright component testing for the product card   | card logic tested without a server      |
| M6.5 Reporting to a dashboard | JUnit ingestion (GitLab/Azure) + trend of pass rate | trend visible per branch                |

---

## Sequencing rationale

- **M1 before M2** because the fixtures and session bootstrap are the hardest part to retrofit: every test
  depends on them, and getting isolation wrong forces a rewrite.
- **API before UI** so the contract gate exists early and the UI suite can use it for arrangement.
- **M3 only after M1–M2** so specs are written once against stable objects instead of being fixed later.
- **M4 before M5/M6** because a framework without a pipeline teaches nothing about its own reliability.
- **M5/M6 are deliberately deferred**: they add value only once the suite is green and fast, and doing them
  early would mean tuning against unstable tests.
