import { useContext, useEffect } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { AuthenticationContext } from "./authenticationState";

export function logout(setAuthenticatedUserID: any, removeCookie: any) {
  setAuthenticatedUserID(null);
  removeCookie("token", { path: "/" });
	// TODO: send fetch request to inform backend of logout:
	// PATCH on /auth/logout (no body on request because it works with cookie token)
}

function Logout() {
  const [, , removeCookie] = useCookies(["token"]);
  const { authenticatedUserID, setAuthenticatedUserID } = useContext(
    AuthenticationContext
  );
  const navigate = useNavigate();

  useEffect(() => {
    logout(setAuthenticatedUserID, removeCookie);
    navigate("/");
  }, []);
}
export default Logout;
