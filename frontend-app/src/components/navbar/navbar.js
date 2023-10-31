import React, { useContext, useEffect, useState } from "react";
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
  OpenLinksButton,
  NavbarLinkExtended,
} from "./NavBar.style";
import LogoImg from "./../../ping.svg";

function Navbar() {
  const [extendNavbar, setExtendNavbar] = useState(false);
  const { authenticatedUserID, setAuthenticatedUserID } = useContext(
    AuthenticationContext
  );

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
            <NavbarLink to="/login"> Login</NavbarLink>
            <NavbarLink to="/chat"> Chat</NavbarLink>
            <NavbarLink to="/play"> Play Game</NavbarLink>
            <NavbarLink to="/leaderboard"> Leaderboard</NavbarLink>
            {authenticatedUserID && (
              <NavbarLink to={"/user/" + authenticatedUserID}>
                Profile
              </NavbarLink>
            )}
            {authenticatedUserID && (
              <NavbarLink to="/logout">Logout</NavbarLink>
            )}
            <OpenLinksButton
              onClick={() => {
                setExtendNavbar((curr) => !curr);
              }}
            >
              {extendNavbar ? <>&#10005;</> : <> &#8801;</>}
            </OpenLinksButton>
          </NavbarLinkContainer>
        </LeftContainer>
        <RightContainer>
          <Logo src={LogoImg}></Logo>
        </RightContainer>
      </NavbarInnerContainer>
      {extendNavbar && (
        <NavbarExtendedContainer>
          <NavbarLinkExtended to="/"> Home</NavbarLinkExtended>
          <NavbarLinkExtended to="/login"> Login</NavbarLinkExtended>
          <NavbarLinkExtended to="/chat"> Chat</NavbarLinkExtended>
          <NavbarLinkExtended to="/play"> Play</NavbarLinkExtended>
          <NavbarLinkExtended to="/leaderboard">
            {" "}
            Leaderboard
          </NavbarLinkExtended>
          {authenticatedUserID && (
            <NavbarLinkExtended to={"/user/" + authenticatedUserID}>
              Profile
            </NavbarLinkExtended>
          )}
          {authenticatedUserID && (
            <NavbarLinkExtended to="/logout">Logout</NavbarLinkExtended>
          )}
        </NavbarExtendedContainer>
      )}
    </NavbarContainer>
  );
}

export default Navbar;
