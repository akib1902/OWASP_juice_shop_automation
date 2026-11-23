import { test, expect } from '@playwright/test';
const user = require('../../data/user');
const authPage = require('../../pages/auth');
const constant = require('../../data/constant');

let auth;
  
test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
        { name: 'welcomebanner_status', value: 'dismiss', url: process.env.BASE_URL },
        { name: 'cookieconsent_status', value: 'dismiss', url: process.env.BASE_URL },
    ]);
    auth = new authPage(page);
});


//goto authpage register new user
test('should register a new user', async ({ page }) => {
    await auth.open();
    // await auth.clickRegisterLink();
    await auth.fillEmailField(user.newRegistration.email);
    await auth.fillPasswordField(user.newRegistration.password);
    await auth.fillConfirmPasswordField(user.newRegistration.password);
    await auth.selectSecurityQuestion();
    await auth.fillSecurityQuestionAnswerField(constant.questions.mothersMaidenName);
    await auth.clickRegisterButton();
});

//register duplicate email user
test('should fail to register a duplicate email user', async ({ page }) => {
    await auth.open();
    await auth.fillEmailField(user.newRegistration.email);
    await auth.fillPasswordField(user.newRegistration.password);
    await auth.fillConfirmPasswordField(user.newRegistration.password);
    await auth.selectSecurityQuestion();
    await auth.fillSecurityQuestionAnswerField(constant.questions.mothersMaidenName);
    await auth.clickRegisterButton();
    await expect(auth.emailMustBeUnique).toBeVisible();
});