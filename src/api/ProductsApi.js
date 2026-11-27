/**
 * Product endpoints (verified on Juice Shop 20.x).
 *
 *   GET /api/Products            -> 200 { status: 'success', data: Product[] }
 *   GET /api/Products/{id}       -> 200 { status, data: Product }
 *                                -> 404 { message: 'Not Found', errors: [] }
 *   GET /rest/products/search    -> 200 { status, data: Product[] }  (legacy UI route)
 */
import { BaseApiClient } from './BaseApiClient.js';

export class ProductsApi extends BaseApiClient {
  list(params = {}) {
    return this.get('/api/Products', { params });
  }

  getById(id) {
    return this.get(`/api/Products/${id}`);
  }

  /** @returns {Promise<object[]>} the array, or [] for a non-2xx response. */
  async listData() {
    const { ok, body } = await this.list();
    return ok && Array.isArray(body?.data) ? body.data : [];
  }

  /** The UI's own search endpoint — used to cross-check what the browser shows. */
  search(term) {
    return this.get('/rest/products/search', { params: { q: term } });
  }
}
