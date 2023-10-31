import { useContext, useEffect } from "react";
import { useCookies } from "react-cookie";
import { AuthenticationContext } from "./authenticationState";

function Logout() {
  const [cookies, setCookie, removeCookie] = useCookies();
  const { userID, setUserID } = useContext(AuthenticationContext);

  useEffect(() => {
    console.log("Removing cookie");
    setUserID(null);
    removeCookie("token", { path: "/" });
  }, []);
}
export default Logout;
