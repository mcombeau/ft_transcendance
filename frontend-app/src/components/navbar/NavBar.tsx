import { useContext, useEffect } from "react";
import { AuthenticationContext } from "../authenticationState";

import {
	NavbarContainer,
	LeftContainer,
	RightContainer,
	NavbarInnerContainer,
	NavbarLinkContainer,
	NavbarLink,
	Logo,
} from "./NavBar.style";
import LogoImg from "/app/src/inc/img/ping.svg";

function Navbar() {
	const { authenticatedUserID } = useContext(AuthenticationContext);

	useEffect(() => {
		// TODO: adapt to incorrect cookie (user does not exist in db ...)
		// if (getUserID(cookies)) {
		//   setIsLogged(true);
		// }
		console.log("USER ID ", authenticatedUserID);
	}, [authenticatedUserID]);

	return (
		<NavbarContainer>
			<NavbarInnerContainer>
				<LeftContainer>
					<NavbarLinkContainer>
						<NavbarLink to="/"> Home</NavbarLink>
						<NavbarLink to="/leaderboard"> Leaderboard</NavbarLink>
						{authenticatedUserID && (
							<NavbarLinkContainer>
								<NavbarLink to="/chat"> Chat</NavbarLink>
								<NavbarLink to="/play"> Play</NavbarLink>
								<NavbarLink to={"/user/" + authenticatedUserID}>
									Profile
								</NavbarLink>
								<NavbarLink to="/logout">Logout</NavbarLink>
							</NavbarLinkContainer>
						)}
						{!authenticatedUserID && (
							<NavbarLink to="/login"> Login</NavbarLink>
						)}
					</NavbarLinkContainer>
				</LeftContainer>
				<RightContainer>
					<Logo src={LogoImg}></Logo>
				</RightContainer>
			</NavbarInnerContainer>
		</NavbarContainer>
	);
}

export default Navbar;
