const user = require('../data/user');

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
        await this.page.goto('/#/login');
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

}
  
module.exports = Login;
  
//   await page.goto('http://localhost:3000/#/login');
//   await page.getByRole('button', { name: 'Close Welcome Banner' }).click();
//   await page.getByRole('textbox', { name: 'Text field for the login email' }).click();
//   await page.getByRole('textbox', { name: 'Text field for the login email' }).fill('akib@example.com');
//   await page.getByRole('textbox', { name: 'Text field for the login password' }).click();
//   await page.getByRole('textbox', { name: 'Text field for the login password' }).fill('Akibakib');
//   await page.getByRole('button', { name: 'Login', exact: true }).click();
//   await page.getByRole('menuitem', { name: 'Logout' }).click();
//   await page.getByRole('button', { name: 'Show/hide account menu' }).click();