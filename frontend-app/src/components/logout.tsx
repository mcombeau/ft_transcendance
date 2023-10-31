import { useContext, useEffect } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { AuthenticationContext } from "./authenticationState";

function Logout() {
  const [cookies, setCookie, removeCookie] = useCookies();
  const { userID, setUserID } = useContext(AuthenticationContext);
  const navigate = useNavigate();

  useEffect(() => {
    setUserID(null);
    removeCookie("token", { path: "/" });
    navigate("/");
  }, []);
}
export default Logout;
