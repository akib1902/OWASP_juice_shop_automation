const baseUrl = process.env.BASE_URL;
const constant = require('../data/constant');

// Reuse this token for authenticated API requests.
export let token

export async function authToken(request, email, password) {
	const registerResponse = await request.post(constant.urls.registerApi, { headers: { 'Content-Type': 'application/json' },
        data: {
            email: email,
            password: password,
            passwordRepeat: password,
        }
    });
	await request.post(constant.urls.securityAnswersApi, { headers: { 'Content-Type': 'application/json' },
        data: {
            answer: "maiden"
        }
    });
    const loginResponse = await request.post(`${constant.urls.loginApi}`, { headers: { 'Content-Type': 'application/json' },
        data: {
            email: email,
            password: password,
        }
    });
    
    const mainToken = await loginResponse.json();
    token = mainToken.authentication.token;
    return mainToken;
}

