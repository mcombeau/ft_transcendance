import { useEffect } from "react";
import { useCookies } from "react-cookie";

function Logout() {
  const [cookies, setCookie, removeCookie] = useCookies();

  useEffect(() => {
    console.log("Removing cookie");
    removeCookie("token", { path: "/" });
  }, []);
}
export default Logout;
