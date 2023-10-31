import { useContext, useEffect } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { AuthenticationContext } from "./authenticationState";

function Logout() {
  const [, , removeCookie] = useCookies(["token"]);
  const { authenticatedUserID, setAuthenticatedUserID } = useContext(
    AuthenticationContext
  );
  const navigate = useNavigate();

  useEffect(() => {
    setAuthenticatedUserID(null);
    removeCookie("token", { path: "/" });
    navigate("/");
  }, []);
}
export default Logout;
