import NavBar from "./components/navbar/NavBar";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/home/home";
import Login from "./components/login/login";
import Chat from "./components/chat/Chat";
import Play from "./components/play/play";
import Leaderboard from "./components/leaderboard/leaderboard";
import Profile from "./components/profile/profile";
import { useEffect, useMemo, useState } from "react";
import { useCookies } from "react-cookie";
import { getUserID, isDarkModeEnabled } from "./cookies";
import { AuthenticationContext } from "./components/authenticationState";
import Logout from "./components/logout/logout";
import { WebSocketProvider, useWebSocket } from "./contexts/WebsocketContext";
import NotFound from "./components/notfound/notfound";
import Banners, { Banner } from "./components/banner/Banner";
import FinalizeLogin from "./components/2fa/TwoFactorAuth";
import SearchBar from "./components/searchbar/searchbar";

function App() {
	const [cookies, ,] = useCookies(["token", "darkmode"]);
	const [authenticatedUserID, setAuthenticatedUserID] = useState(
		getUserID(cookies)
	);
	const socket = useWebSocket();
	const value = useMemo(
		() => ({ authenticatedUserID, setAuthenticatedUserID }),
		[authenticatedUserID]
	);
	const [banners, setBanners] = useState<Banner[]>([]);

	useEffect(() => {
		if (socket) {
			socket.on("logout", () => {
				setAuthenticatedUserID(null);
			});
			return () => {
				socket.off("logout");
			};
		} else {
			console.log("App - No socket!");
		}
	}, [socket]);

	return (
		<WebSocketProvider>
			<Router>
				<div className={`app ${isDarkModeEnabled(cookies) ? "dark" : ""}`}>
					<AuthenticationContext.Provider value={value}>
						<NavBar />
						{Banners(banners)}

						<div className="content">
							<Routes>
								<Route path="/" element={<Home />} />
								<Route path="/login" element={<Login />} />
								<Route
									path="/chat"
									element={<Chat setBanners={setBanners} />}
								/>
								<Route
									path="/chat/:userID"
									element={<Chat setBanners={setBanners} />}
								/>
								<Route
									path="/play/:inviteID"
									element={<Play setBanners={setBanners} />}
								/>
								<Route
									path="/watch/:watchGameID"
									element={<Play setBanners={setBanners} />}
								/>
								<Route
									path="/play"
									element={<Play setBanners={setBanners} />}
								/>
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
								<Route
									path="/search"
									element={<SearchBar setBanners={setBanners} />}
								/>
							</Routes>
						</div>
					</AuthenticationContext.Provider>
				</div>
			</Router>
		</WebSocketProvider>
	);
}

export default App;
