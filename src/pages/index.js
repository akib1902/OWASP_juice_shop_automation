/**
 * Page-object composition root.
 *
 * WHY a factory + WeakMap cache instead of importing classes in every spec:
 *  - a test asks for `app.checkout`, never for `new CheckoutPage(page)`;
 *  - page objects are constructed once per page, so they can hold state safely;
 *  - swapping an implementation (e.g. a redesign) is one edit here.
 *
 * This is also what makes the "one page = one object graph" idea explicit:
 * the anonymous `app` bundle and the authenticated `shop` bundle differ only in
 * *which Page* they were built from.
 */
import { BasketPage } from './BasketPage.js';
import { CataloguePage } from './CataloguePage.js';
import { CheckoutPage } from './CheckoutPage.js';
import { LoginPage } from './LoginPage.js';
import { OrderHistoryPage } from './OrderHistoryPage.js';
import { ProductDetailsPage } from './ProductDetailsPage.js';
import { RegisterPage } from './RegisterPage.js';
import { HeaderComponent } from '../components/HeaderComponent.js';
import { OverlaysComponent } from '../components/OverlaysComponent.js';
import { SnackbarComponent } from '../components/SnackbarComponent.js';

const cache = new WeakMap();

/** @param {import('@playwright/test').Page} page */
export function pages(page) {
  if (!cache.has(page)) {
    cache.set(page, {
      header: new HeaderComponent(page),
      overlays: new OverlaysComponent(page),
      snackbar: new SnackbarComponent(page),
      login: new LoginPage(page),
      register: new RegisterPage(page),
      catalogue: new CataloguePage(page),
      details: new ProductDetailsPage(page),
      basket: new BasketPage(page),
      checkout: new CheckoutPage(page),
      orders: new OrderHistoryPage(page),
    });
  }
  return cache.get(page);
}

export {
  BasketPage,
  CataloguePage,
  CheckoutPage,
  LoginPage,
  OrderHistoryPage,
  ProductDetailsPage,
  RegisterPage,
};
