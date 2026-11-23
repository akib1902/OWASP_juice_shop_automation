const { expect } = require('@playwright/test');
const user = require('../data/user');
const constant = require('../data/constant');

class Auth {
    constructor(page) {
        this.page = page;
        this.registerLink = page.getByRole('link', { name: 'Not yet a customer?' });
        this.regEmailField = page.getByRole('textbox', { name: 'Email address field' });
        this.regPasswordField = page.getByRole('textbox', { name: 'Field for the password' });
        this.confirmPasswordField = page.getByRole('textbox', { name: 'Field to confirm the password' });
        this.securityQuestionDropdown = page.getByRole('combobox', {
            name: 'Selection list for the security question',
        });
        this.mothersMaidenNameOption = page.getByRole('option', {
            name: "Mother's maiden name?",
        });
        this.securityQuestionAnswerField = page.getByRole('textbox', {
            name: 'Field for the answer to the security question',
        });
        this.registerButton = page.getByRole('button', {
            name: 'Button to complete the registration',
        });
        this.emailMustBeUnique = page.getByText('Email must be unique');
    }

    async open() {
        await this.page.goto(constant.urls.authPage);
    }

    async fillEmailField(email) {
        await this.regEmailField.fill(email);
    }

    async fillPasswordField(password) {
        await this.regPasswordField.fill(password);
    }

    async fillConfirmPasswordField(password) {
        await this.confirmPasswordField.fill(password);
    }

    async selectSecurityQuestion() {
        await expect(async () => {
            if (!(await this.mothersMaidenNameOption.isVisible())) {
                await this.securityQuestionDropdown.click();
            }
            await expect(this.mothersMaidenNameOption).toBeVisible({ timeout: 2000 });
        }).toPass();

        await this.mothersMaidenNameOption.click();
    }

    async fillSecurityQuestionAnswerField(answer) {
        await this.securityQuestionAnswerField.fill(answer);
    }

    async clickRegisterButton() {
        await this.registerButton.click();
    }

    async registerNewUser(
        email = user.newUser1.email,
        password = user.newUser1.password
    ) {
        await this.open();
        await this.fillEmailField(email);
        await this.fillPasswordField(password);
        await this.fillConfirmPasswordField(password);
        await this.selectSecurityQuestion();
        await this.fillSecurityQuestionAnswerField(constant.questions.mothersMaidenName);
        await this.clickRegisterButton();
        await expect(this.page).toHaveURL(constant.urls.loginPage);
    }
}

module.exports = Auth;