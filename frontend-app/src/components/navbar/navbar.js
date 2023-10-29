import React, { useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { getUsername, getUserID } from "../../cookies";

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
import { WebSocketContext } from "../../contexts/WebsocketContext";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const [extendNavbar, setExtendNavbar] = useState(false);
  const [cookies, setCookie, removeCookie] = useCookies(["cookie-name"]);
  const [username, setUsername] = useState(getUsername(cookies));
  const socket = useContext(WebSocketContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (getUsername(cookies) != null) {
      setUsername(getUsername(cookies));
    }
  }, [cookies]);

  useEffect(() => {
    socket.on("login", (username) => {
      setUsername(username);
    });
  }, []);

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
            {username && (
              <NavbarLink to={"/user/" + getUserID(cookies)}>
                Profile
              </NavbarLink>
            )}
            {username && <NavbarLink to="/logout">Logout</NavbarLink>}
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
          <NavbarLinkExtended to={"/user/" + getUserID(cookies)}>
            Profile
          </NavbarLinkExtended>
        </NavbarExtendedContainer>
      )}
    </NavbarContainer>
  );
}

export default Navbar;
