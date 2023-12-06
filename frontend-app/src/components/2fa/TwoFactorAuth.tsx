import jwtDecode from "jwt-decode";
import { useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { getAuthInfo, getUserID } from "../../cookies";
import { AuthenticationContext } from "../authenticationState";
import { BannerType, createBanner } from "../banner/Banner";

function FinalizeLogin({ setBanners }) {
	const [twoFaCode, setTwoFaCode] = useState<string>("");
	const [twoFaEnabled, setTwoFaEnabled] = useState<boolean>(true);
	const [cookies, setCookie, removeCookie] = useCookies(["token"]);
	const { setAuthenticatedUserID } = useContext(AuthenticationContext);
	const navigate = useNavigate();

	// TODO: Eject from this page if not supposed to be there //
	// TODO: Check 42 user has authenticatedUserID not set before getting here !!! //

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

	useEffect(() => {
		// Check if user needs 2fa from cookie
		//  TODO: check that the cookie is set fast enough by the back for this check to work //
		//  TODO: maybe do a waiting state before this is executed and the cookie is checked (waiting for login info...)//
		const is2faEnabled: boolean =
			getAuthInfo(cookies)["isTwoFactorAuthenticationEnabled"];
		setTwoFaEnabled(is2faEnabled);
	}, []);

	function TwoFactorAuth() {
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

	function SuccessFullLogin() {
		try {
			const loggedUserID = getUserID(cookies);
			setAuthenticatedUserID(loggedUserID);
			navigate(`/user/${loggedUserID}#settings`);
		} catch (e) {
			console.warn("Send Auth: JWT decode error");
			return;
		}
		return (
			<div>You have logged in successfully, please wait for redirection</div>
		);
	}

	return <div>{twoFaEnabled ? TwoFactorAuth() : SuccessFullLogin()}</div>;
}

export default FinalizeLogin;
