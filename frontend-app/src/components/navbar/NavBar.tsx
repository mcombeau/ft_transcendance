import { useContext, useEffect, useState } from "react";
import { AuthenticationContext } from "../authenticationState";
import { AiOutlineClose, AiOutlineMenu } from "react-icons/ai";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { logoutUser } from "../logout/logout";

function Navbar() {
	const { authenticatedUserID, setAuthenticatedUserID } = useContext(
		AuthenticationContext
	);
	const [cookies, , removeCookie] = useCookies(["token"]);
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

	return (
		<div className="navbar flex justify-between items-center text-sage bg-teal ">
			<h1 className={"w-full text-lg lg:text-3xl font-bold"}>
				ft_transcendance
			</h1>
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
					<li className="navlink">
						<a href="/login">Login</a>
					</li>
				)}
			</ul>
			<div onClick={handleNav} className="block md:hidden">
				{nav ? <AiOutlineClose size={20} /> : <AiOutlineMenu size={20} />}
			</div>
			<ul
				className={
					nav
						? "fixed left-0 top-16 right-0 w-[60%] h-full bg-teal ease-in-out duration-500"
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
					<li className="navlink-extended">
						<a href="/login">Login</a>
					</li>
				)}
			</ul>
		</div>
	);
}
export default Navbar;
