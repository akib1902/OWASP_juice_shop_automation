import { test, expect } from '@playwright/test';
import Auth from '../../pages/auth';
const user = require('../../data/user');
const Login = require('../../pages/login');
const constant = require('../../data/constant');

let login;
  
test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
        { name: 'welcomebanner_status', value: 'dismiss', url: process.env.BASE_URL },
        { name: 'cookieconsent_status', value: 'dismiss', url: process.env.BASE_URL },
    ]);
    login = new Login(page);
});

// invalid email/password login test suite
test('should fail in login with invalid password', async ({ page }) => {
    await login.open();
    await login.logIn(user.newUser1.email, user.invalidUser.password);
    await expect(page.getByText('Invalid email or password.')).toBeVisible();
});
test('should fail in login with invalid email', async ({ page }) => {
    await login.open();
    await login.logIn(user.invalidUser.email, user.newUser1.password);
    await expect(page.getByText('Invalid email or password.')).toBeVisible();
});

test('login with valid credentials', async ({ page }) => {
    const email = await login.createUniqueEmail();
    const auth = new Auth(page);

    await auth.registerNewUser(email, user.newUser1.password);
    await login.logIn(email, user.newUser1.password);
    await expect(page).toHaveURL(constant.urls.homePage);
});

test('logout after login', async ({ page }) => {
    const email = await login.createUniqueEmail();
    const auth = new Auth(page);

    await auth.registerNewUser(email, user.newUser1.password);
    await login.logIn(email, user.newUser1.password);
    await expect(page).toHaveURL(constant.urls.homePage);

    await login.logOut();
});


