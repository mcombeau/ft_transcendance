import { useContext, useEffect, useState } from "react";
import { AuthenticationContext } from "../authenticationState";

import {
	NavbarContainer,
	LeftContainer,
	RightContainer,
	NavbarExtendedContainer,
	NavbarInnerContainer,
	NavbarLinkContainer,
	NavbarLink,
	Logo,
} from "./NavBar.style";
import LogoImg from "./../../ping.svg";

function Navbar() {
	// const [extendNavbar, setExtendNavbar] = useState(false);
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
// TODO: if add type to navbarcontainer to make it work
// <OpenLinksButton
// 	onClick={() => {
// 		setExtendNavbar((curr) => !curr);
// 	}}
// >
// 	{extendNavbar ? <>&#10005;</> : <> &#8801;</>}
// </OpenLinksButton>
// {extendNavbar && (
//   <NavbarExtendedContainer>
//     <NavbarLinkExtended to="/"> Home</NavbarLinkExtended>
//     <NavbarLinkExtended to="/login"> Login</NavbarLinkExtended>
//     <NavbarLinkExtended to="/chat"> Chat</NavbarLinkExtended>
//     <NavbarLinkExtended to="/play"> Play</NavbarLinkExtended>
//     <NavbarLinkExtended to="/leaderboard">
//       {" "}
//       Leaderboard
//     </NavbarLinkExtended>
//     {authenticatedUserID && (
//       <NavbarLinkExtended to={"/user/" + authenticatedUserID}>
//         Profile
//       </NavbarLinkExtended>
//     )}
//     {authenticatedUserID && (
//       <NavbarLinkExtended to="/logout">Logout</NavbarLinkExtended>
//     )}
//   </NavbarExtendedContainer>
// )}

export default Navbar;
