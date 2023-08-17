import React, { useEffect, useState } from "react";
import { useCookies } from "react-cookie";

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
  const [cookies] = useCookies(["cookie-name"]);
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (cookies["Username"] != undefined) {
      setUsername(cookies["Username"]);
    }
  }, [cookies]);

  return (
    <NavbarContainer extendNavbar={extendNavbar}>
      <NavbarInnerContainer>
        <LeftContainer>
          <NavbarLinkContainer>
            <NavbarLink to="/"> Home</NavbarLink>
            <NavbarLink to="/login"> Login</NavbarLink>
            <NavbarLink to="/chat"> Chat</NavbarLink>
            <NavbarLink to="/play"> Play Game</NavbarLink>
            <NavbarLink to="/leaderboard"> Leaderboard</NavbarLink>
            <NavbarLink to={`/user/${username}`}> {username}</NavbarLink>
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
          <NavbarLinkExtended to={`/user/${username}`}>
            {" "}
            {username}
          </NavbarLinkExtended>
        </NavbarExtendedContainer>
      )}
    </NavbarContainer>
  );
}

export default Navbar;
