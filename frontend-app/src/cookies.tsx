import jwtDecode from "jwt-decode";

type AuthCookie = {
	username: string;
	sub: number;
	iat: number;
	exp: number;
};

export function getAuthInfo(cookies: any): AuthCookie {
	try {
		if (cookies["token"]) {
			var token: AuthCookie = jwtDecode(cookies["token"]);
			return token;
		}
	} catch (e) {
		console.warn("Get Auth Info: JWT decode error");
		return null;
	}
}

export function getAuthInfoFromToken(token: string): AuthCookie {
	try {
		return jwtDecode(token);
	} catch (e) {
		console.warn("get Auth Info From Token: JWT decode error");
		return null;
	}
}

export function getUsername(cookies: any): string {
	var authInfo: AuthCookie = getAuthInfo(cookies);
	if (authInfo) {
		return getAuthInfo(cookies)["username"];
	} else {
		return null;
	}
}
export function getUserID(cookies: any): number {
	var authInfo: AuthCookie = getAuthInfo(cookies);
	if (authInfo) {
		if (
			authInfo["isTwoFactorAuthenticationEnabled"] &&
			!authInfo["isTwoFactorAuthenticated"]
		)
			return null;
		return getAuthInfo(cookies)["userID"];
	} else {
		return null;
	}
}

export function getIs2faEnabled(cookies: any): boolean {
	var authInfo: AuthCookie = getAuthInfo(cookies);
	if (authInfo) {
		return getAuthInfo(cookies)["isTwoFactorAuthenticationEnabled"];
	} else {
		return null;
	}
}

export function getIs2faAuthenticated(cookies: any): boolean {
	var authInfo: AuthCookie = getAuthInfo(cookies);
	if (authInfo) {
		return getAuthInfo(cookies)["isTwoFactorAuthenticated"];
	} else {
		return null;
	}
}

export function getUserIDFromToken(token: string): number {
	var authInfo: AuthCookie = getAuthInfoFromToken(token);
	if (authInfo) {
		return authInfo["userID"];
	} else {
		return null;
	}
}
