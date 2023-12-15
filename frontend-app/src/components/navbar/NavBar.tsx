import { useContext, useEffect, useState } from "react";
import { AuthenticationContext } from "../authenticationState";
import { AiOutlineClose, AiOutlineMenu } from "react-icons/ai";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { logoutUser } from "../logout/logout";
import { IoSunnyOutline } from "react-icons/io5";
import { FaRegMoon } from "react-icons/fa6";
import { isDarkModeEnabled } from "../../cookies";

function Navbar() {
	const { authenticatedUserID, setAuthenticatedUserID } = useContext(
		AuthenticationContext
	);
	const [cookies, setCookie, removeCookie] = useCookies(["token", "darkmode"]);
	const [nav, setNav] = useState(false);
	const socket = useContext(WebSocketContext);
	const navigate = useNavigate();
	const handleNav = () => {
		setNav(!nav);
	};

	useEffect(() => {
		socket.on("logout", () => {
			console.log("Socket on logout");
			logoutUser(
				socket,
				cookies,
				setAuthenticatedUserID,
				removeCookie,
				navigate
			);
		});
		return () => {
			socket.off("logout");
		};
	}, []);

	function toggleDarkModeCookie() {
		if (isDarkModeEnabled(cookies)) {
			setCookie("darkmode", "false");
		} else {
			setCookie("darkmode", "true");
		}
		console.log("After set cookie:", cookies["darkmode"]);
	}

	return (
		<div className="navbar flex justify-between items-center text-sage dark:text-darksage bg-teal dark:bg-darkteal">
			<h1 className={"w-full text-lg lg:text-3xl font-bold"}>
				ft_transcendance
			</h1>
			<div onClick={toggleDarkModeCookie}>
				{isDarkModeEnabled(cookies["darkmode"]) ? (
					<IoSunnyOutline className="w-6 h-6" />
				) : (
					<FaRegMoon className="w-6 h-6" />
				)}
			</div>

			<ul className="hidden md:flex font-mono">
				<li className="navlink">
					<a href="/">Home</a>
				</li>
				<li className="navlink">
					<a href="/leaderboard">Leaderboard</a>
				</li>
				{authenticatedUserID && (
					<>
						<li className="navlink">
							<a href="/chat">Chat</a>
						</li>
						<li className="navlink">
							<a href="/play"> Play</a>
						</li>
						<li className="navlink">
							<a href={"/user/" + authenticatedUserID}>Profile</a>
						</li>
						<li className="navlink">
							<a href="/logout">Logout</a>
						</li>
					</>
				)}
				{!authenticatedUserID && (
					<>
						<li className="navlink">
							<a href="/login">Login</a>
						</li>
						<form action="/backend/auth/42login">
							<button className="bg-darkblue dark:bg-darkdarkblue rounded-md m-2 p-2 px-4 whitespace-nowrap">
								Login with 42
							</button>
						</form>
					</>
				)}
			</ul>
			<div
				onClick={handleNav}
				className={`block ${nav ? "" : "md:hidden"} z-30`}
			>
				{nav ? <AiOutlineClose size={20} /> : <AiOutlineMenu size={20} />}
			</div>
			<ul
				className={
					nav
						? "fixed left-0 top-16 right-0 w-[60%] h-full bg-teal dark:bg-darkteal ease-in-out duration-500"
						: "ease-in-out duration-500 fixed top-16 h-full left-[-100%]"
				}
			>
				<li className="navlink-extended">
					<a href="/">Home</a>
				</li>
				<li className="navlink-extended">
					<a href="/leaderboard">Leaderboard</a>
				</li>
				{authenticatedUserID && (
					<>
						<li className="navlink-extended">
							<a href="/chat">Chat</a>
						</li>
						<li className="navlink-extended">
							<a href="/play">Play</a>
						</li>
						<li className="navlink-extended">
							<a href={"/user/" + authenticatedUserID}>Profile</a>
						</li>
						<li className="navlink-extended">
							<a href="/logout">Logout</a>
						</li>
					</>
				)}
				{!authenticatedUserID && (
					<>
						<li className="navlink-extended">
							<a href="/login">Login</a>
						</li>
						<form
							action="/backend/auth/42login"
							className="navlink-extended bg-darkblue dark:bg-darkdarkblue"
						>
							<button>Login with 42</button>
						</form>
					</>
				)}
			</ul>
		</div>
	);
}
export default Navbar;
