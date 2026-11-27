# Test plan and traceability matrix

Source: `test cases.md` (33 cases). Every case below maps to exactly one spec line, so a failed ID can be found
and run in one command.

Environment: OWASP Juice Shop `20.4.0` via `docker run --rm -p 3000:3000 bkimminich/juice-shop`.

---

## Authentication

| ID       | Scenario                                | Spec                         | Verification                                              |
| -------- | --------------------------------------- | ---------------------------- | --------------------------------------------------------- |
| AUTH-001 | Open login page                         | `tests/e2e/auth.spec.js`     | email/password/button visible, route `#/login`            |
| AUTH-002 | Login with valid credentials            | same                         | token stored, header rendered                             |
| AUTH-003 | Login with invalid password             | same                         | error copy + still on `#/login` + no token                |
| AUTH-004 | Login with invalid email                | same                         | error copy + still on `#/login` + no token                |
| AUTH-005 | Register new account                    | same                         | redirect to login + snackbar + the new account can log in |
| AUTH-006 | Register duplicate email                | same                         | rejected, still on `#/register`                           |
| AUTH-007 | Logout                                  | same                         | token cleared                                             |
| AUTH-008 | Access protected resource without token | `tests/api/auth.api.spec.js` | 401 anonymous, 200 with token, basket scoped to owner     |

## Cart

| ID       | Scenario              | Spec                     | Verification                              |
| -------- | --------------------- | ------------------------ | ----------------------------------------- |
| CART-001 | Add product to cart   | `tests/e2e/cart.spec.js` | snackbar, badge = 1, row visible          |
| CART-002 | Add multiple products | same                     | both rows, row count 2                    |
| CART-003 | Remove product        | same                     | only the removed row disappears           |
| CART-004 | View cart             | same                     | UI rows equal the API basket contents     |
| CART-005 | Verify cart quantity  | same                     | UI quantity 2 after increment, API agrees |
| CART-006 | Verify cart total     | same                     | total = (price × qty) summed, to the cent |

## Catalogue / search

| ID       | Scenario                       | Spec                          | Verification                                                 |
| -------- | ------------------------------ | ----------------------------- | ------------------------------------------------------------ |
| PROD-001 | Load product catalogue         | `tests/e2e/catalogue.spec.js` | ≥10 cards rendered                                           |
| PROD-002 | Open product details           | same                          | modal heading = product, price matches, closes cleanly       |
| PROD-003 | Search existing product        | same                          | results heading + the product card                           |
| PROD-004 | Search nonexistent product     | same                          | heading rendered, zero cards (no false pass on a blank page) |
| PROD-005 | Search with special characters | same                          | input handled, app remains usable, recovery search works¹    |
| PROD-006 | Navigate product pages         | same                          | open/close details twice, catalogue still interactive        |

¹ Juice Shop reflects the search term unsanitised by design (it is an XSS teaching app). The test therefore
verifies _usability and recovery_, and the reflection is recorded as a known, intentional finding rather than
asserted as a pass/fail.

## Orders

| ID        | Scenario                 | Spec                       | Verification                                               |
| --------- | ------------------------ | -------------------------- | ---------------------------------------------------------- |
| ORDER-001 | Proceed to checkout      | `tests/e2e/orders.spec.js` | basket → `#/address/select`                                |
| ORDER-002 | Checkout without address | same                       | empty address form cannot be submitted, route unchanged    |
| ORDER-003 | Complete valid checkout  | same                       | confirmation page, order id, total = items + delivery      |
| ORDER-004 | Verify order history     | same                       | placed order id appears in `#/order-history`               |
| ORDER-005 | Verify order via API     | same                       | `/rest/order-history` row matches id, total and quantities |

## API

| ID      | Scenario                       | Spec                             | Verification                               |
| ------- | ------------------------------ | -------------------------------- | ------------------------------------------ |
| API-001 | Retrieve product list          | `tests/api/products.api.spec.js` | 200, envelope, ≥1 product                  |
| API-002 | Retrieve product by ID         | same                             | 200, id/name/price match the seed          |
| API-003 | Invalid product ID             | same                             | 404 for missing **and** malformed ids      |
| API-004 | Login with valid credentials   | `tests/api/auth.api.spec.js`     | 200, JWT-shaped token, basket id           |
| API-005 | Login with invalid credentials | same                             | 401, no token, explanatory body            |
| API-006 | Authenticated request          | same                             | 200 on `/api/BasketItems`                  |
| API-007 | Request without authentication | same                             | 401, no data leaked                        |
| API-008 | Validate product JSON schema   | `tests/api/products.api.spec.js` | every product, not just the first          |
| API-009 | Validate error response schema | `tests/api/contract.api.spec.js` | 404 schema + 401 schema + HTML login error |

---

## Coverage notes

- **Test cases covered:** 33/33.
- **Layers:** 11 API tests (no browser, ~5s) + 24 UI tests per browser project.
- **Tags:** `@smoke` (release gate), `@api`, `@auth`, `@cart`, `@catalogue`, `@orders`, `@regression`.
- **Not covered (out of scope of the supplied cases):** review submission, coupon redemption, deluxe membership,
  file upload, admin-only screens, i18n, and the app's challenge/vulnerability scoring.
