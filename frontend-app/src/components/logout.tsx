import { useContext, useEffect } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { AuthenticationContext } from "./authenticationState";
import { WebSocketContext, WebSocketProvider } from "../contexts/WebsocketContext";
import { Socket } from 'socket.io-client';

export function logout(setAuthenticatedUserID: any, removeCookie: any, cookies: any, socket: Socket) {
	// TODO: send fetch request to inform backend of logout:
	// PATCH on /auth/logout (no body on request because it works with cookie token)
	console.log('Attemting logout. Token', cookies["token"]);
    // var request = {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Athorization: `Bearer ${cookies["token"]}`,
    //   },
    // };
    // fetch("http://localhost:3001/auth/logout", request).then(async (response) => {
    //   const data = await response.json();
    //   if (!response.ok) {
    //     console.log("error user logout");
    //     return;
    //   }
    //   console.log("Response: ", data);
    // });
	socket.emit('logout', cookies["token"]);
  setAuthenticatedUserID(null);
  removeCookie("token", { path: "/" });
}

function Logout() {
  const [cookies, , removeCookie] = useCookies(["token"]);
  const { authenticatedUserID, setAuthenticatedUserID } = useContext(
    AuthenticationContext
  );
  const navigate = useNavigate();
  const socket = useContext(WebSocketContext);

  useEffect(() => {
    logout(setAuthenticatedUserID, removeCookie, cookies, socket);
    navigate("/");
  }, []);

	return <WebSocketProvider value={socket}></WebSocketProvider>
}
export default Logout;
