import { Dispatch, SetStateAction, useContext, useEffect } from "react";
import { useCookies } from "react-cookie";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { Socket } from "socket.io-client";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import { AuthenticationContext } from "../authenticationState";

export function logoutUser(
	socket: Socket,
	cookies: any,
	setAuthenticatedUserID: Dispatch<SetStateAction<number>>,
	removeCookie: any,
	navigate: NavigateFunction
) {
	socket.emit("leave game", cookies["token"]);
	socket.emit("stop watching", cookies["token"]);
	socket.emit("logout", cookies["token"]);
	setAuthenticatedUserID(null);
	removeCookie("token", { path: "/" });
	navigate("/");
}

function Logout() {
	const [cookies, , removeCookie] = useCookies(["token"]);
	const { setAuthenticatedUserID } = useContext(AuthenticationContext);
	const navigate = useNavigate();
	const socket = useContext(WebSocketContext);

	useEffect(() => {
		logoutUser(socket, cookies, setAuthenticatedUserID, removeCookie, navigate);
	}, [cookies, navigate, removeCookie, setAuthenticatedUserID, socket]);

	return <div></div>;
}
export default Logout;
