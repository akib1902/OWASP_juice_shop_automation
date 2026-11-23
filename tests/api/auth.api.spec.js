import {test, expect} from '@playwright/test';
const constant = require('../../data/constant');


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
        const responseToken = await request.post(constant.urls.loginApi, {
            data: {
                email: process.env.email,
                password: process.env.password
            }
        });
        const body = await responseToken.json();
        const token = body.authentication.token;
        const responseBasket = await request.get(`${constant.urls.accessBasketPage}`, {headers: {Authorization: `Bearer ${token}`}});
        expect(responseBasket.status()).toBe(200);
    });

});