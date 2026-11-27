/**
 * ============================================================================
 *  playwright.config.js  —  single source of truth for how the suite runs
 * ============================================================================
 *
 *  STRATEGY (interview notes)
 *  ---------------------------------------------------------------------------
 *  1. NOTHING HARD-CODED ABOUT THE ENVIRONMENT.
 *     baseURL / API URL / retries / workers all come from src/config/env.js,
 *     which layers dotenv over safe local defaults. The same repo therefore
 *     runs against local Docker, a CI container, staging or prod-ish envs
 *     without a code change: `BASE_URL=... npx playwright test`.
 *
 *  2. TWO TEST "SHAPES", TWO PROJECTS.
 *     - `api`      : pure HTTP contract tests (tests/api). No browser, ~ms each.
 *     - `chromium` / `firefox` / `webkit` : UI tests (tests/e2e).
 *     UI projects `testIgnore` the api folder and vice versa, so a browser
 *     project never pays the cost of spinning a page for a HTTP-only test.
 *
 *  3. FAILURE FORENSICS BY DEFAULT.
 *     trace 'on-first-retry' + screenshot 'only-on-failure' + video
 *     'retain-on-failure'. We deliberately do NOT record traces for every
 *     test: tracing every run is slow and produces gigabytes. On the first
 *     retry we get a full DOM/network/NW snapshot, which is what you actually
 *     need to debug a flake.
 *
 *  4. RETRIES ARE A CI-ONLY SAFETY NET, NEVER A LOCAL HABIT.
 *     retries = 0 locally (so flakes are felt and fixed), 2 in CI (so a
 *     network hiccup doesn't block a release). Any test that only passes on
 *     retry is tracked as technical debt — see docs/STRATEGY.md §Flake policy.
 *
 *  5. PARALLELISM IS THE DEFAULT BECAUSE THE SUITE IS WRITTEN TO BE ISOLATED.
 *     Every test that mutates server state (cart, orders) registers its own
 *     throw-away user (src/fixtures/base.fixture.js -> `customer`), so no two
 *     workers share a basket. That is what makes `fullyParallel: true` safe.
 *
 *  6. REPORTERS: human + machine.
 *     `list` for the terminal, `html` for triage, `junit` for CI test
 *     dashboards, `json` for the nightly trend job. All land in ./reports,
 *     which is git-ignored.
 * ============================================================================
 */
import { defineConfig, devices } from '@playwright/test';

import { env } from './src/config/env.js';

export default defineConfig({
  // Root that all spec paths are resolved against.
  testDir: './tests',

  // Where traces/videos/screenshots for FAILED tests are written.
  outputDir: './reports/artifacts',

  // Per-test budget (includes fixtures + hooks). Generous, but bounded:
  // a hung test must fail before the CI job timeout, not during it.
  timeout: env.timeout.test,

  // Budget for a single auto-retrying assertion (`await expect(locator)`).
  expect: { timeout: env.timeout.expect },

  // Every spec runs in its own worker and in any order. Safe only because
  // tests are data-isolated — see note 5 above.
  fullyParallel: true,

  // A committed `test.only` would silently shrink CI coverage. Never allow it.
  forbidOnly: env.isCI,

  retries: env.retries,
  workers: env.workers,

  reporter: [
    // Console.
    [env.isCI ? 'dot' : 'list'],
    // Rich local triage report (trace viewer links per failure).
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    // Machine-readable, for CI dashboards and trend graphs.
    ['json', { outputFile: 'reports/results.json' }],
    // JUnit XML — what Jenkins/GitLab/Azure actually ingest.
    ['junit', { outputFile: 'reports/junit.xml' }],
  ],

  use: {
    // Every `page.goto('/#/login')` is relative to this. No absolute URLs in tests.
    baseURL: env.baseURL,

    // Per-action / per-navigation budgets. Without them a single click on a
    // detached element can burn the whole test timeout and hide the real error.
    actionTimeout: env.timeout.action,
    navigationTimeout: env.timeout.navigation,

    // Determinism: a fixed viewport means responsive breakpoints never
    // surprise a test (mobile is covered by its own device project).
    viewport: { width: 1440, height: 900 },

    // Juice Shop is served over plain HTTP locally; this keeps the same config
    // usable behind self-signed staging certificates.
    ignoreHTTPSErrors: true,

    // Attribution for every artifact we collect on failure.
    trace: env.artifacts.traces,
    screenshot: env.artifacts.screenshot,
    video: env.artifacts.video,

    // Auto-wait for fonts/images before screenshots; avoids "half-painted" diffs.
    launchOptions: { args: ['--disable-dev-shm-usage'] },
  },

  projects: [
    /* ---------------------------------------------------------------------
     * API project — no browser at all.
     * `request` fixture only, so these tests are fast enough to run on every
     * commit, even as the primary quality gate.
     * ------------------------------------------------------------------- */
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: env.apiURL },
    },

    /* ---------------------------------------------------------------------
     * Desktop UI — the workhorse. Chromium is the "release gate" project.
     * ------------------------------------------------------------------- */
    {
      name: 'chromium',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },

    /* ---------------------------------------------------------------------
     * Cross-browser. Same tests, different engines — proves the suite isn't
     * accidentally coupled to CSS/JS behaviour that only Chromium has.
     * ------------------------------------------------------------------- */
    {
      name: 'firefox',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Safari'] },
    },

    /* ---------------------------------------------------------------------
     * Responsive check. A small subset (tagged @responsive) runs on a phone
     * profile — the Juice Shop header/cart behave differently at 390px wide.
     * ------------------------------------------------------------------- */
    {
      name: 'mobile-chrome',
      testDir: './tests/e2e',
      grep: /@responsive/,
      use: { ...devices['Pixel 7'] },
    },
  ],
});
