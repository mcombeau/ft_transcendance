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
import { getUserID, isDarkModeEnabled } from "./cookies";
import { AuthenticationContext } from "./components/authenticationState";
import Logout from "./components/logout/logout";
import { WebSocketContext } from "./contexts/WebsocketContext";
import NotFound from "./components/notfound/notfound";
import Banners, { Banner } from "./components/banner/Banner";
import FinalizeLogin from "./components/2fa/TwoFactorAuth";

function App() {
	const [cookies, ,] = useCookies(["token", "darkmode"]);
	const [authenticatedUserID, setAuthenticatedUserID] = useState(
		getUserID(cookies)
	);
	const socket = useContext(WebSocketContext);
	const value = useMemo(
		() => ({ authenticatedUserID, setAuthenticatedUserID }),
		[authenticatedUserID]
	);
	const [banners, setBanners] = useState<Banner[]>([]);

	useEffect(() => {
		socket.on("logout", () => {
			console.log("RECEIVED LOGOUT EMIT");
			setAuthenticatedUserID(null);
		});
		return () => {
			socket.off("logout");
		};
	}, []);

	useEffect(() => {
		console.log("Dark mode toggled");
	}, []);

	return (
		<Router>
			<div className={`app ${isDarkModeEnabled(cookies) ? "dark" : ""}`}>
				<AuthenticationContext.Provider value={value}>
					<NavBar />
					{Banners(banners, setBanners)}
					<div className="content">
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/login" element={<Login />} />
							<Route path="/chat" element={<Chat setBanners={setBanners} />} />
							<Route
								path="/chat/:userID"
								element={<Chat setBanners={setBanners} />}
							/>
							<Route path="/play/:inviteID" element={<Play />} />
							<Route path="/watch/:watchGameID" element={<Play />} />
							<Route path="/play" element={<Play />} />
							<Route path="/leaderboard" element={<Leaderboard />} />
							<Route
								path="/user/:id"
								element={<Profile setBanners={setBanners} />}
							/>
							<Route path="/logout" element={<Logout />} />
							<Route path="*" element={<NotFound />} />
							<Route path="/not-found" element={<NotFound />} />

							<Route
								path="/finalize-login"
								element={<FinalizeLogin setBanners={setBanners} />}
							/>
						</Routes>
					</div>
				</AuthenticationContext.Provider>
			</div>
		</Router>
	);
}

export default App;
