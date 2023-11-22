import "./App.css";
import NavBar from "./components/navbar/NavBar";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/home/home";
import Login from "./components/login/login";
import Chat from "./components/chat/Chat";
import Play from "./components/play/play";
import Leaderboard from "./components/leaderboard/leaderboard";
import Profile from "./components/profile/profile";
import { useContext, useEffect, useMemo, useState } from "react";
import { useCookies } from "react-cookie";
import { getUserID } from "./cookies";
import { AuthenticationContext } from "./components/authenticationState";
import Logout from "./components/logout/logout";
import { WebSocketContext } from "./contexts/WebsocketContext";
import NotFound from "./components/notfound/notfound";

function App() {
	const [cookies, , removeCookie] = useCookies(["token"]);
	const [authenticatedUserID, setAuthenticatedUserID] = useState(
		getUserID(cookies)
	);
	const value = useMemo(
		() => ({ authenticatedUserID, setAuthenticatedUserID }),
		[authenticatedUserID]
	);
	const socket = useContext(WebSocketContext);

	useEffect(() => {
		var request = {
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${cookies["token"]}`,
			},
		};

		const currentUserID: number = getUserID(cookies);
		if (!currentUserID) return;
		fetch(`/backend/users/${currentUserID}`, request).then(async (response) => {
			await response.json();
			if (!response.ok) {
				setAuthenticatedUserID(null);
				removeCookie("token", { path: "/" });
				return;
			}
			setAuthenticatedUserID(getUserID(cookies));
			socket.emit("login", cookies["token"]);
			socket.emit("connection");
		});
	}, [cookies, removeCookie]);

	return (
		<Router>
			<AuthenticationContext.Provider value={value}>
				<NavBar />
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/login" element={<Login />} />
					<Route path="/chat" element={<Chat />} />
					<Route path="/chat/:userID" element={<Chat />} />
					<Route path="/play/:inviteID" element={<Play />} />
					<Route path="/watch/:watchGameID" element={<Play />} />
					<Route path="/play" element={<Play />} />
					<Route path="/leaderboard" element={<Leaderboard />} />
					<Route path="/user/:id" element={<Profile />} />
					<Route path="/logout" element={<Logout />} />
					<Route path="*" element={<NotFound />} />
				</Routes>
			</AuthenticationContext.Provider>
		</Router>
	);
}

export default App;
