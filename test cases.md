Test ID	Scenario	Expected result
AUTH-001	Open login page	Login page appears
AUTH-002	Login with valid credentials	User authenticated
AUTH-003	Login with invalid password	Login rejected
AUTH-004	Login with invalid email	Login rejected
AUTH-005	Register new account	Account created
AUTH-006	Register duplicate email	Duplicate rejected
AUTH-007	Logout	User logged out
AUTH-008	Access protected resource without token	Access denied
Test ID	Scenario	Expected result
CART-001	Add product to cart	Item added
CART-002	Add multiple products	Correct items displayed
CART-003	Remove product	Item removed
CART-004	View cart	Correct contents displayed
CART-005	Verify cart quantity	Quantity matches
CART-006	Verify cart total	Total calculated correctly
Test ID	Scenario	Expected result
PROD-001	Load product catalogue	Products displayed
PROD-002	Open product details	Correct details displayed
PROD-003	Search existing product	Matching product found
PROD-004	Search nonexistent product	Empty state displayed
PROD-005	Search with special characters	Application handles input safely
PROD-006	Navigate product pages	Navigation works
Test ID	Scenario	Expected result
ORDER-001	Proceed to checkout	Checkout page appears
ORDER-002	Checkout without address	Validation shown
ORDER-003	Complete valid checkout	Order created
ORDER-004	Verify order history	Order appears
ORDER-005	Verify order details through API	Correct order data returned
Test ID	Scenario	Expected result
API-001	Retrieve product list	HTTP 200
API-002	Retrieve product by ID	Correct product returned
API-003	Invalid product ID	Appropriate error
API-004	Login with valid credentials	Authentication succeeds
API-005	Login with invalid credentials	Authentication rejected
API-006	Authenticated request	Authorized access
API-007	Request without authentication	Appropriate rejection
API-008	Validate product JSON schema	Schema passes
API-009	Validate error response schema	Schema passes


run with docker: "docker run --rm -p 3000:3000 bkimminich/juice-shop"
the web app is running on my http://localhost:3000/#/

