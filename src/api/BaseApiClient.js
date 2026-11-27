/**
 * ============================================================================
 *  BaseApiClient — the HTTP layer every API test and every fixture shares
 * ============================================================================
 *
 *  STRATEGY
 *  --------
 *  1. ONE TRANSPORT, MANY CLIENTS.
 *     This class owns URL joining, auth headers, JSON parsing and response
 *     normalisation. AuthApi/ProductsApi/BasketApi only describe *endpoints*.
 *     A change in how we authenticate is therefore a one-file change.
 *
 *  2. NEVER THROW ON A NEGATIVE STATUS.
 *     An API test asserting a 401 needs the 401 object, not an exception. So
 *     `send()` always resolves with { status, ok, body, headers }. Throwing is
 *     an explicit choice made by the caller (see `auth.loginOrThrow`).
 *
 *  3. API CLIENT = SETUP ENGINE TOO.
 *     UI tests use this to arrange state (register a user, seed a basket)
 *     instead of clicking through the UI for minutes. This is the "hybrid
 *     testing" pattern: arrange fast over HTTP, assert in the browser.
 * ============================================================================
 */
import { env } from '../config/env.js';
import { createLogger } from '../support/logger.js';

const log = createLogger('api');

/** Body may be JSON, text, or empty — normalise without hiding the raw text. */
const parseBody = async (response) => {
  const text = await response.text();
  if (!text) return { body: undefined, text };
  try {
    return { body: JSON.parse(text), text };
  } catch {
    return { body: text, text };
  }
};

export class BaseApiClient {
  #baseURL;
  #token;

  /**
   * @param {import('@playwright/test').APIRequestContext} request Playwright's request fixture.
   * @param {{ baseURL?: string, token?: string }} [options]
   */
  constructor(request, { baseURL = env.apiURL, token } = {}) {
    if (!request) throw new Error('BaseApiClient requires the Playwright `request` fixture');
    this.request = request;
    this.#baseURL = baseURL.replace(/\/+$/, '');
    this.#token = token;
  }

  get baseURL() {
    return this.#baseURL;
  }

  /** Immutable-ish re-scope: a token-bound view of the same transport. */
  withToken(token) {
    const scoped = Object.create(this);
    scoped.#token = token;
    return scoped;
  }

  /** Absolute URL for a path, so callers never concatenate strings themselves. */
  url(path = '') {
    return path.startsWith('http') ? path : `${this.#baseURL}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  defaultHeaders(extra = {}) {
    const headers = { Accept: 'application/json', ...extra };
    if (this.#token) headers.Authorization = `Bearer ${this.#token}`;
    return headers;
  }

  async send(method, path, { data, headers, params, token } = {}) {
    const authToken = token ?? this.#token;
    const requestHeaders = {
      ...this.defaultHeaders(headers),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    log.debug(`${method} ${path}`, { params });
    const response = await this.request.fetch(this.url(path), {
      method,
      headers: requestHeaders,
      data,
      params,
      failOnStatusCode: false,
    });

    const { body, text } = await parseBody(response);
    const result = { status: response.status(), ok: response.ok(), headers: response.headers(), body, text };
    log.debug(`${method} ${path} -> ${result.status}`);
    return result;
  }

  get(path, options) {
    return this.send('GET', path, options);
  }
  post(path, options = {}) {
    return this.send('POST', path, options);
  }
  put(path, options = {}) {
    return this.send('PUT', path, options);
  }
  delete(path, options) {
    return this.send('DELETE', path, options);
  }
}
