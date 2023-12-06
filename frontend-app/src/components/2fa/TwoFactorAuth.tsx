import jwtDecode from "jwt-decode";
import { useContext, useState } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { AuthenticationContext } from "../authenticationState";
import { BannerType, createBanner } from "../banner/Banner";

function TwoFactorAuth({ setBanners }) {
	const [twoFaCode, setTwoFaCode] = useState<string>("");
	const [cookies, setCookie] = useCookies(["token"]);
	const { setAuthenticatedUserID } = useContext(AuthenticationContext);
	const navigate = useNavigate();

	async function submit2faCode(e: any) {
		e.preventDefault();
		var request = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${cookies["token"]}`,
			},
			body: JSON.stringify({
				twoFactorAuthenticationCode: twoFaCode.toString(),
			}),
		};

		const access_token = await fetch(
			`/backend/auth/2fa/authenticate`,
			request
		).then(async (response) => {
			const data = await response.json();
			if (!response.ok) {
				console.log("Error authenticating with 2fa");
				createBanner(
					"Error authenticating with 2fa ",
					setBanners,
					BannerType.Alert
				);
				return "";
			}
			setCookie("token", data.access_token, { path: "/" }); // TODO: check if await is needed/if it does anything
			return data.access_token;
		});
		if (access_token) {
			try {
				const loggedUserID = jwtDecode(access_token)["userID"];
				setAuthenticatedUserID(loggedUserID);
				navigate(`/user/${loggedUserID}#settings`);
			} catch (e) {
				console.warn("Send Auth: JWT decode error");
				return;
			}
		}
	}

	return (
		<div className="background-element">
			<h3>Please enter the code provided by your Google Authenticator App</h3>
			<form onSubmit={submit2faCode}>
				<input
					className="p-2 m-2"
					type="text"
					placeholder="2fa code"
					value={twoFaCode}
					onChange={(e) => {
						setTwoFaCode(e.target.value);
					}}
				/>
				<button className="button">Submit</button>
			</form>
		</div>
	);
}

export default TwoFactorAuth;
