/**
 * Authentication endpoints.
 *
 * Verified against Juice Shop 20.x:
 *   POST /api/Users        -> 201 { status, data: { id, email, ... } }
 *   POST /rest/user/login  -> 200 { authentication: { token, bid, umail } }
 *                          -> 401 text/plain "Invalid email or password."
 *
 * The 401 is plain text, not JSON. That is exactly the kind of asymmetry a
 * schema test exists to make visible, so we keep the raw `text` on the response.
 */
import { BaseApiClient } from './BaseApiClient.js';

export class AuthApi extends BaseApiClient {
  /**
   * Register a customer. Used by the `customer` fixture: registering a user over
   * HTTP takes ~50ms, doing it through the UI takes ~2s. Same outcome, faster
   * arrangement.
   */
  register({ email, password, passwordRepeat = password, securityQuestionId = 1, securityAnswer = 'qa' }) {
    return this.post('/api/Users', {
      data: {
        email,
        password,
        passwordRepeat,
        securityQuestion: { id: securityQuestionId },
        securityAnswer,
      },
    });
  }

  /** Login, returning a discriminated result (never throws on bad credentials). */
  async login(email, password) {
    const response = await this.post('/rest/user/login', { data: { email, password } });
    const auth = response.body?.authentication;
    return {
      ...response,
      token: auth?.token,
      basketId: auth?.bid,
      email: auth?.umail ?? email,
    };
  }

  /** For fixture setup: a failed login is a broken framework, not a test result. */
  async loginOrThrow(email, password) {
    const result = await this.login(email, password);
    if (!result.ok || !result.token) {
      throw new Error(`Login failed for ${email} (HTTP ${result.status}): ${result.text?.slice(0, 120)}`);
    }
    return result;
  }

  /** POST /rest/user/login without credentials — used to prove request validation. */
  loginWithoutCredentials() {
    return this.post('/rest/user/login', { data: {} });
  }

  whoAmI(token) {
    return this.get('/rest/user/whoami', { token });
  }
}
