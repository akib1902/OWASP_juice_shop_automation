import { test, expect } from '@playwright/test';
const user = require('../data/user');

let loginPage;

test.beforeEach(async ({ page }) => {
  loginPage = require('../pages/login');
  await page.goto('http://localhost:3000/#/login');
  await page.getByRole('button', { name: 'Close Welcome Banner' }).click();
}

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