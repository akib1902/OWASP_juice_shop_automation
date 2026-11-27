/**
 * Checkout prerequisites: saved payment cards and addresses.
 *
 * Verified on Juice Shop v20:
 *   POST /api/Cards    -> 201 { status, data: { id, cardNum (masked on read), ... } }
 *   GET  /api/Cards    -> 200 { status, data: [{ cardNum: '************1111' }] }
 *   POST /api/Addresss -> 201 { status, data: { id, ... } }
 *
 * WHY these live in the API layer at all: a brand-new customer has no payment
 * method, so the payment step renders zero options and the wizard cannot be
 * completed. Seeding a card over HTTP (50ms) is arrangement; the checkout itself
 * is still exercised through the UI. This is the hybrid-testing pattern applied
 * to a prerequisite the test is not about.
 */
import { BaseApiClient } from './BaseApiClient.js';

export class CheckoutApi extends BaseApiClient {
  cards(token) {
    return this.get('/api/Cards', { token });
  }

  /** Seed a valid, non-expiring test card. Never a real card number. */
  addCard({
    token,
    fullName = 'Qa Automation',
    cardNum = 4111111111111111,
    expMonth = 12,
    expYear = 2099,
  } = {}) {
    return this.post('/api/Cards', { token, data: { fullName, cardNum, expMonth, expYear } });
  }

  addAddress({ token, fullName, mobileNum, zipCode, streetAddress, city, state, country }) {
    return this.post('/api/Addresss', {
      token,
      data: { fullName, mobileNum, zipCode, streetAddress, city, state, country },
    });
  }
}
