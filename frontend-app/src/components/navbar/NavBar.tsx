import { useContext } from "react";
import { AuthenticationContext } from "../authenticationState";

import LogoImg from "/app/src/inc/img/logo.svg";

function Navbar() {
	const { authenticatedUserID } = useContext(AuthenticationContext);

	return (
		<div>
			<div>
				<div>
					<div>
						<a href="/"> Home</a>
						<a href="/leaderboard"> Leaderboard</a>
						{authenticatedUserID && (
							<div>
								<a href="/chat"> Chat</a>
								<a href="/play"> Play</a>
								<a href={"/user/" + authenticatedUserID}>Profile</a>
								<a href="/logout">Logout</a>
							</div>
						)}
						{!authenticatedUserID && <a href="/login"> Login</a>}
					</div>
				</div>
				<div>
					<img src={LogoImg}></img>
				</div>
			</div>
		</div>
	);
}

export default Navbar;
