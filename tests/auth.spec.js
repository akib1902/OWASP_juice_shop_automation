import { test, expect } from '@playwright/test';
const user = require('../data/user');
const authPage = require('../pages/auth');
const constant = require('../data/constant');

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
    await auth.fillEmailField(user.newUser1.email);
    await auth.fillPasswordField(user.newUser1.password);
    await auth.fillConfirmPasswordField(user.newUser1.password);
    await auth.selectSecurityQuestion();
    await auth.fillSecurityQuestionAnswerField(constant.questions.mothersMaidenName);
    await auth.clickRegisterButton();
});

//login with new user