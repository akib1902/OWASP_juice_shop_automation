const user = require('../data/user');
const constant = require('../data/constant');
const auth = require('./auth');

class Login{
    constructor(page){
        this.page = page;
        this.emailField = page.getByRole('textbox', { name: 'Text field for the login email' });
        this.passwordField = page.getByRole('textbox', { name: 'Text field for the login password' });
        this.loginButton = page.getByRole('button', { name: 'Login', exact: true });
        this.accountMenu = page.getByRole('button', { name: 'Show/hide account menu' });
        this.logOutButton = page.getByRole('menuitem', { name: 'Logout' });
        // this.dismissBannerButton = page.getByRole('button', { name: 'Close Welcome Banner' });
    }
    async open(){
        await this.page.goto(constant.urls.loginPage);
        console.log(`Login page opened on: ${process.env.BASE_URL}`);
        // await this.dismissBannerButton.click();
    }
    
    async logIn(userName, password){
        await this.emailField.fill(userName);
        await this.passwordField.fill(password);
        await this.loginButton.click();
    }

    async logOut(){
        await this.accountMenu.click();
        await this.logOutButton.click();
    }

    async createUniqueEmail(){
        const timestamp = new Date().getTime();
        const uniqueEmail = `user_${timestamp}@example.com`;
        return uniqueEmail;
    }

}
  
module.exports = Login;