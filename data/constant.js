module.exports = {
  urls: {
    baseUrl: process.env.BASE_URL,
    loginPage: `${process.env.BASE_URL}/#/login`,
    homePage: `${process.env.BASE_URL}/#/search`,
    authPage: `${process.env.BASE_URL}/#/register`,
    accessBasketPage: `${process.env.BASE_URL}/rest/basket/6`
  },
  apiUrls: {
    loginApi: `${process.env.BASE_URL}/rest/user/login`,
    registerApi: `${process.env.BASE_URL}/rest/user/register`,
    securityAnswersApi: `${process.env.BASE_URL}/api/SecurityAnswers/`,
  },
  questions: {
    mothersMaidenName: "maiden",
    fatherBirthDate: "01/01/1970",
    favoritePet: "dog",
    eldestsiblingsMiddleName: "bro",
    favoriteBook: "book1",
  }
};