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

export function getUsername(cookies: any): string {
  var authInfo: AuthCookie = getAuthInfo(cookies);
  if (authInfo) {
    return getAuthInfo(cookies)["username"];
  } else {
    return null;
  }
}
