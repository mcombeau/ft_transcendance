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
	const socket = useContext(WebSocketContext);
	const value = useMemo(
		() => ({ authenticatedUserID, setAuthenticatedUserID }),
		[authenticatedUserID]
	);
	useEffect(() => {
		socket.on("logout", () => {
			console.log("RECEIVED LOGOUT EMIT");
			setAuthenticatedUserID(null);
		});
		return () => {
			socket.off("logout");
		};
	}, []);


	return (
		<Router>
			<div className="app">
				<AuthenticationContext.Provider value={value}>
					<NavBar />
					<div className="content">
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
							<Route path="/not-found" element={<NotFound />} />
						</Routes>
					</div>
				</AuthenticationContext.Provider>
			</div>
		</Router>
	);
}

export default App;
