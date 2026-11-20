const user = require('../data/user');

class Login{
    constructor(page){
        this.page = page;
        this.emailField = page.getByRole('textbox', { name: 'Text field for the login email' });
        this.passwordField = page.getByRole('textbox', { name: 'Text field for the login password' });
        this.loginButton = page.getByRole('button', { name: 'Login', exact: true });
    }

}
  
module.exports = new Login();
  
//   await page.goto('http://localhost:3000/#/login');
//   await page.getByRole('button', { name: 'Close Welcome Banner' }).click();
//   await page.getByRole('textbox', { name: 'Text field for the login email' }).click();
//   await page.getByRole('textbox', { name: 'Text field for the login email' }).fill('akib@example.com');
//   await page.getByRole('textbox', { name: 'Text field for the login password' }).click();
//   await page.getByRole('textbox', { name: 'Text field for the login password' }).fill('Akibakib');
//   await page.getByRole('button', { name: 'Login', exact: true }).click();