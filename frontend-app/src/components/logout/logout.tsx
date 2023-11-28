import { useContext, useEffect } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import { AuthenticationContext } from "../authenticationState";

function Logout() {
	const [cookies, , removeCookie] = useCookies(["token"]);
	const { setAuthenticatedUserID } = useContext(AuthenticationContext);
	const navigate = useNavigate();
	const socket = useContext(WebSocketContext);

	function logoutUser() {
		socket.emit("leave game", cookies["token"]);
		socket.emit("stop watching", cookies["token"]);
		socket.emit("logout", cookies["token"]);
		setAuthenticatedUserID(null);
		removeCookie("token", { path: "/" });
		navigate("/");
		// TODO: Check if this summons the devil or not.
		window.location.reload();
	}

	useEffect(() => {
		logoutUser();
	}, []);
	return <div></div>;
}
export default Logout;
