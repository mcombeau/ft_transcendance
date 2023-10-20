import jwtDecode from "jwt-decode";

type AuthCookie = {
  username: string;
  sub: number;
  iat: number;
  exp: number;
};

export function getAuthInfo(cookies: any): AuthCookie {
  if (cookies["token"]) {
    var token: AuthCookie = jwtDecode(cookies["token"]);
    return token;
  }
  return null;
}

export function getAuthInfoFromToken(token: string): AuthCookie {
  return jwtDecode(token);
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
