import { useState } from "react";
import { useCookies } from "react-cookie";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthenticationContext } from "../authenticationState";
import jwtDecode from "jwt-decode";

function Login() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [newUsername, setNewUsername] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [email, setEmail] = useState("");
	const [, setCookie] = useCookies(["token"]);
	let navigate = useNavigate();
	const { setAuthenticatedUserID } = useContext(AuthenticationContext);

	const sendAuth = async (e: any) => {
		e.preventDefault();
		if (username === "" || password === "") return;
		var request = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ username: username, password: password }),
		};
		const access_token = await fetch("/backend/auth/login", request).then(
			async (response) => {
				const data = await response.json();
				if (!response.ok) {
					console.log("error user login");
					return;
				}
				setCookie("token", data.access_token, { path: "/" });
				return data.access_token;
			}
		);
		try {
			const loggedUserID = jwtDecode(access_token)["userID"];
			setAuthenticatedUserID(loggedUserID);
			setUsername("");
			setPassword("");
			navigate(`/user/${loggedUserID}#settings`);
		} catch (e) {
			console.warn("Send Auth: JWT decode error");
			return;
		}
	};

	const signIn = (e: any) => {
		e.preventDefault();
		if (newUsername === "" || newPassword === "" || email === "") return;
		var request = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				username: newUsername,
				password: newPassword,
				email: email,
			}),
		};
		fetch("/backend/users", request).then(async (response) => {
			const data = await response.json();
			if (!response.ok) {
				console.log("error user creation");
				return;
			}
			console.log("Response: ", data);
			console.log("New user ", newUsername, " ", newPassword, " ", email);
		});
		setNewUsername("");
		setNewPassword("");
		setEmail("");
	};

	return (
		<div id="login">
			<div className="log">
				<h1>Welcome to the Game</h1>
				<form onSubmit={sendAuth}>
					{/* <InputContainer> */}
					<input
						type="text"
						placeholder="Username"
						value={username}
						onChange={(e) => {
							setUsername(e.target.value);
						}}
					/>
					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => {
							setPassword(e.target.value);
						}}
					/>
					<button>Login</button>
				</form>
				<form onSubmit={signIn}>
					<input
						type="text"
						placeholder="Username"
						value={newUsername}
						onChange={(e) => {
							setNewUsername(e.target.value);
						}}
					/>
					<input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => {
							setEmail(e.target.value);
						}}
					/>
					<input
						type="password"
						placeholder="Password"
						value={newPassword}
						onChange={(e) => {
							setNewPassword(e.target.value);
						}}
					/>
					<button>Sign up</button>
				</form>
				<h2>or login with</h2>
				<form action="/backend/auth/42login">
					<button>Login with 42</button>
				</form>
			</div>
		</div>
	);
}

export default Login;
