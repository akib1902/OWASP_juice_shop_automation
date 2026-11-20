import { test, expect } from '@playwright/test';
const user = require('../data/user');
const Login = require('../pages/login');

let login;
  
test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
        { name: 'welcomebanner_status', value: 'dismiss', url: process.env.BASE_URL },
        { name: 'cookieconsent_status', value: 'dismiss', url: process.env.BASE_URL },
    ]);
    login = new Login(page);
});

// invalid email/password login test suite
test('should fail in login without invalid password', async ({ page }) => {
    await login.open();
    await login.logIn(user.newUser1.email, user.invalidUser.password);
    await expect(page.getByText('Invalid email or password.')).toBeVisible();
});
test('should fail in login without invalid email', async ({ page }) => {
    await login.open();
    await login.logIn(user.invalidUser.email, user.newUser1.password);
    await expect(page.getByText('Invalid email or password.')).toBeVisible();
});

test('login with valid credentials', async ({ page }) => {
    await login.open();
    await login.logIn(user.newUser1.email, user.newUser1.password);
});

// test('test', async ({ page }) => {
//   await expect(page.getByText('Invalid email or password.')).toBeVisible();
//   await page.getByRole('link', { name: 'Not yet a customer?' }).click();
//   await page.getByRole('textbox', { name: 'Email address field' }).click();
//   await page.getByRole('textbox', { name: 'Email address field' }).fill('akib@example.com');
//   await page.getByRole('textbox', { name: 'Field for the password' }).click();
//   await page.getByRole('textbox', { name: 'Field for the password' }).fill('Akibakib');
//   await page.getByRole('textbox', { name: 'Field to confirm the password' }).click();
//   await page.getByRole('textbox', { name: 'Field to confirm the password' }).fill('Akibakib');
//   await page.getByRole('combobox', { name: 'Selection list for the' }).click();
//   await page.getByRole('listbox', { name: 'Selection list for the' }).click();
//   await page.getByRole('textbox', { name: 'Field for the answer to the' }).click();
//   await page.getByRole('textbox', { name: 'Field for the answer to the' }).fill('maiden');
//   await page.getByRole('button', { name: 'Button to complete the' }).click();
//   await page.getByRole('textbox', { name: 'Text field for the login email' }).click();
//   await page.getByRole('textbox', { name: 'Text field for the login email' }).fill('akib@example.com');
//   await page.getByRole('textbox', { name: 'Text field for the login password' }).click();
//   await page.getByRole('textbox', { name: 'Text field for the login password' }).fill('Akibakib');
//   await page.getByRole('button', { name: 'Login', exact: true }).click();
// });