/**
 * Basket endpoints (verified on Juice Shop 20.x).
 *
 *   GET    /api/BasketItems            -> 200 with token, HTML 401 without
 *   POST   /api/BasketItems            -> 201 { status, data: { id, quantity, ... } }
 *   PUT    /api/BasketItems/{id}       -> 200 (quantity update)
 *   DELETE /api/BasketItems/{id}       -> 200
 *   GET    /rest/basket/{basketId}     -> 200 { data: { Products: [...] } }
 *
 * The basket is server-side and tied to the user, which is precisely why every
 * UI test gets its own freshly registered customer — no two workers can collide.
 */
import { BaseApiClient } from './BaseApiClient.js';

export class BasketApi extends BaseApiClient {
  items(token) {
    return this.get('/api/BasketItems', { token });
  }

  /** Seed a basket instantly for a test that is really about checkout. */
  addItem({ token, productId, quantity = 1, basketId }) {
    return this.post('/api/BasketItems', {
      token,
      data: { ProductId: productId, BasketId: basketId, quantity },
    });
  }

  updateQuantity({ token, itemId, quantity }) {
    return this.put(`/api/BasketItems/${itemId}`, { token, data: { quantity } });
  }

  removeItem({ token, itemId }) {
    return this.delete(`/api/BasketItems/${itemId}`, { token });
  }

  /** Full basket including joined product data — used to verify UI totals. */
  basket(basketId, token) {
    return this.get(`/rest/basket/${basketId}`, { token });
  }

  /** Convenience for arrangement: add a product and return the created item id. */
  async addItemAndGetId(args) {
    const response = await this.addItem(args);
    if (!response.ok) {
      throw new Error(`Could not add product ${args.productId} to basket (HTTP ${response.status})`);
    }
    return response.body?.data?.id;
  }
}
