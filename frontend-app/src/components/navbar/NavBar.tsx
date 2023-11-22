import { useContext } from "react";
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
import LogoImg from "/app/src/inc/img/logo.svg";

function Navbar() {
	const { authenticatedUserID } = useContext(AuthenticationContext);

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
