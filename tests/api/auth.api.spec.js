import {test, expect} from '@playwright/test';
const constant = require('../../data/constant');
const { authToken } = require('../../src/auth.api');
const user = require('../../data/user');


test.describe('Authentication API Tests', () => {

    test('should authenticate and return a token', async ({ request }) => {

    });

    test('should deny without token', async ({ request }) => {
        const response = await request.get(`${constant.urls.accessBasketPage}`);
        expect(response.status()).toBe(401);
    });

    test('should deny with invalid token', async ({ request }) => {
        const response = await request.get(`${constant.urls.accessBasketPage}`, {headers: {Authorization: 'Bearer invalid_token'}});
        expect(response.status()).toBe(401);
    });
    
    test('should allow with valid token', async ({ request }) => {

        const token = await authToken(request, user.newRegistration.email, user.newRegistration.password);

        const responseBasket = await request.get(`${constant.urls.accessBasketPage}`, {headers: {Authorization: `Bearer ${token}`}});
        expect(responseBasket.status()).toBe(200);
    });

});