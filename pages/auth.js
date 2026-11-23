const user = require('../data/user');
const constant = require('../data/constant');

class Auth{
    constructor(page){
        this.page = page;
        this.registerLink = this.page.getByRole('link', { name: 'Not yet a customer?' });
        this.regEmailField = this.page.getByRole('textbox', { name: 'Email address field' });
        this.regPasswordField = this.page.getByRole('textbox', { name: 'Field for the password' });
        this.confirmPasswordField = this.page.getByRole('textbox', { name: 'Field to confirm the password' });
        this.securityQuestionDropdown = this.page.getByRole('combobox', { name: 'Selection list for the' }).locator('svg');
        this.mothersMaidenNameOption = this.page.getByRole('option', { name: "Mother's maiden name?" });
        this.securityQuestionAnswerField = this.page.getByRole('textbox', { name: 'Field for the answer to the' });
        this.registerButton = this.page.getByRole('button', { name: 'Button to complete the' });
        this.emailMustBeUnique = this.page.getByText('Email must be unique');
    }

    async open(){
        await this.page.goto(constant.urls.authPage);
    }

    async fillEmailField(email){
        await this.regEmailField.fill(email);
    }

    async fillPasswordField(password){
        await this.regPasswordField.fill(password);
    }

    async fillConfirmPasswordField(password){
        await this.confirmPasswordField.fill(password);
    }

    async selectSecurityQuestion(){
        await this.securityQuestionDropdown.click();
        await this.page.waitForTimeout(1000);
        await this.mothersMaidenNameOption.click();
    }

    async fillSecurityQuestionAnswerField(answer){
        await this.securityQuestionAnswerField.fill(answer);
    }

    async clickRegisterButton(){
        await this.registerButton.click();
    }

    async registerNewUser(){
        await this.open();
        await this.fillEmailField(user.newUser1.email);
        await this.fillPasswordField(user.newUser1.password);
        await this.fillConfirmPasswordField(user.newUser1.password);
        await this.selectSecurityQuestion();
        await this.fillSecurityQuestionAnswerField(constant.questions.mothersMaidenName);
        await this.clickRegisterButton();
    }
}
module.exports = Auth;