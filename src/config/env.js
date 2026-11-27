/**
 * ============================================================================
 *  src/config/env.js — one place where configuration is resolved & validated
 * ============================================================================
 *
 *  STRATEGY
 *  --------
 *  Tests must never read `process.env` directly. If they do, a typo becomes a
 *  silent `undefined` somewhere deep in a page object. Instead every value is
 *  resolved ONCE here, coerced to the right type, given a sane local default,
 *  and (for things that matter) validated at import time.
 *
 *  Precedence: real environment variable  >  .env file  >  built-in default.
 *  That ordering is what lets CI override a committed local default.
 *
 *  Secrets (real passwords/tokens) belong in `.env` or the CI secret store,
 *  never in the repo. `.env` is git-ignored; `.env.example` documents the keys.
 * ============================================================================
 */
import 'dotenv/config';

/** Coerce to a finite number, falling back when the variable is absent/garbage. */
const num = (raw, fallback) => {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** Accept the many shapes a CI boolean can take ("1", "true", "yes", ...). */
const bool = (raw, fallback = false) =>
  raw === undefined ? fallback : ['1', 'true', 'yes', 'on'].includes(String(raw).toLowerCase());

/** Strip trailing slashes so `baseURL + '/#/login'` never becomes `//#/login`. */
const origin = (value) => value.replace(/\/+$/, '');

const BASE_URL = origin(process.env.BASE_URL ?? 'http://localhost:3000');
const IS_CI = bool(process.env.CI);

export const env = Object.freeze({
  /** UI origin under test. */
  baseURL: BASE_URL,
  /** API origin. Separate knob because some deployments serve the API elsewhere. */
  apiURL: origin(process.env.API_URL ?? BASE_URL),

  isCI: IS_CI,
  headless: !bool(process.env.HEADED),

  /** 0 locally (feel your flakes), 2 in CI (absorb infra noise). */
  retries: num(process.env.RETRIES, IS_CI ? 2 : 0),
  /** `undefined` lets Playwright pick workers = CPU cores. CI pins it. */
  workers: process.env.WORKERS ? num(process.env.WORKERS, 1) : undefined,

  timeout: {
    test: num(process.env.TEST_TIMEOUT, 60_000),
    expect: num(process.env.EXPECT_TIMEOUT, 10_000),
    action: num(process.env.ACTION_TIMEOUT, 15_000),
    navigation: num(process.env.NAVIGATION_TIMEOUT, 30_000),
  },

  /** Failure forensics: full trace on the first retry only (cost control). */
  artifacts: Object.freeze({
    traces: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  }),

  /**
   * Seeded Juice Shop accounts. The admin account ships with the container
   * (admin@juice-sh.op / admin123) and is used for cross-user/authorization
   * checks. It can be overridden per environment.
   */
  admin: Object.freeze({
    email: process.env.ADMIN_EMAIL ?? 'admin@juice-sh.op',
    password: process.env.ADMIN_PASSWORD ?? 'admin123',
  }),

  /** Password used for every freshly registered throw-away customer. */
  defaultPassword: process.env.DEFAULT_PASSWORD ?? 'P@ssw0rd!123',
});

/**
 * Fail fast, loudly, at startup rather than mid-run.
 * A bad BASE_URL is the single most common cause of "everything is red".
 */
if (!/^https?:\/\//.test(env.baseURL)) {
  throw new Error(`[config] BASE_URL must be an absolute http(s) URL. Received: "${env.baseURL}"`);
}
