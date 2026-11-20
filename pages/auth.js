const user = require('../data/user');
const constant = require('../data/constant');

class Auth{
    constructor(page){
        this.page = page;
        this.registerLink = this.page.getByRole('link', { name: 'Not yet a customer?' });
        this.regEmailField = this.page.getByRole('textbox', { name: 'Email address field' });
        this.regPasswordField = this.page.getByRole('textbox', { name: 'Field for the password' });
        this.confirmPasswordField = this.page.getByRole('textbox', { name: 'Field to confirm the password' });
        this.securityQuestionDropdown = this.page.getByRole('combobox', { name: 'Selection list for the' });
        this.mothersMaidenNameOption = this.page.getByRole('option', { name: "Mother's maiden name?" });
        this.securityQuestionAnswerField = this.page.getByRole('textbox', { name: 'Field for the answer to the' });
        this.registerButton = this.page.getByRole('button', { name: 'Button to complete the' });
    }

    async open(){
        await this.page.goto('/#/register');
    }

    // async clickRegisterLink(){
    //     await this.registerLink.click();
    // }

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
        await this.mothersMaidenNameOption.click();
    }

    async fillSecurityQuestionAnswerField(answer){
        await this.securityQuestionAnswerField.fill(answer);
    }

    async clickRegisterButton(){
        await this.registerButton.click();
    }
}
module.exports = Auth;



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