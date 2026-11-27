/**
 * Composition root for the API layer.
 *
 * WHY a factory instead of a class hierarchy: tests and fixtures should ask for
 * the capability they need ("give me an auth client"), not for a transport.
 * Every client extends BaseApiClient, so they all share one request context and
 * one base URL — and a token-scoped view costs one object, not one login.
 */
import { AuthApi } from './AuthApi.js';
import { BasketApi } from './BasketApi.js';
import { CheckoutApi } from './CheckoutApi.js';
import { OrdersApi } from './OrdersApi.js';
import { ProductsApi } from './ProductsApi.js';

export function createApiClients(request, options = {}) {
  return {
    auth: new AuthApi(request, options),
    products: new ProductsApi(request, options),
    basket: new BasketApi(request, options),
    checkout: new CheckoutApi(request, options),
    orders: new OrdersApi(request, options),
  };
}

export { BaseApiClient } from './BaseApiClient.js';
export { AuthApi } from './AuthApi.js';
export { BasketApi } from './BasketApi.js';
export { CheckoutApi } from './CheckoutApi.js';
export { OrdersApi } from './OrdersApi.js';
export { ProductsApi } from './ProductsApi.js';
