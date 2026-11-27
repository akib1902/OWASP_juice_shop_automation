/**
 * Order endpoints (verified on Juice Shop 20.x).
 *
 *   GET /rest/order-history -> 200 { status, data: [{ orderId, totalPrice, products: [...] }] }
 *
 * NOTE: /api/Orders does not exist in v20 — it answers with an HTML
 * "Unexpected path" page. That is why the client points at the real route and
 * why ORDER-005 asserts on this shape. A framework that blindly assumed
 * /api/Orders would report a product bug that is really framework rot.
 */
import { BaseApiClient } from './BaseApiClient.js';

export class OrdersApi extends BaseApiClient {
  history(token) {
    return this.get('/rest/order-history', { token });
  }

  /** @returns {Promise<object[]>} order rows, or [] when unauthenticated/empty. */
  async historyData(token) {
    const { ok, body } = await this.history(token);
    return ok && Array.isArray(body?.data) ? body.data : [];
  }

  /** Find one order by its id — the join point for UI <-> API assertions. */
  async findByOrderId(token, orderId) {
    const orders = await this.historyData(token);
    return orders.find((order) => order.orderId === orderId);
  }
}
