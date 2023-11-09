import "./App.css";
import NavBar from "./components/navbar/navbar";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import Home from "./components/home/home";
import Login from "./components/login/login";
import Chat from "./components/chat/Chat";
import Play from "./components/play/play";
import Leaderboard from "./components/leaderboard/leaderboard";
import Profile from "./components/profile/profile";
import Logout, { logout } from "./components/logout";
import { useEffect, useMemo, useState } from "react";
import { useCookies } from "react-cookie";
import { getUserID } from "./cookies";
import { AuthenticationContext } from "./components/authenticationState";

function App() {
  const [cookies, , removeCookie] = useCookies(["token"]);
  const [authenticatedUserID, setAuthenticatedUserID] = useState(
    getUserID(cookies)
  );
  const value = useMemo(
    () => ({ authenticatedUserID, setAuthenticatedUserID }),
    [authenticatedUserID]
  );

  useEffect(() => {
    // Check user with id actually exists in database

    var request = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies["token"]}`,
      },
    };

    fetch(`http://localhost:3001/users/${getUserID(cookies)}`, request).then(
      async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.log("User from cookie does not exist");
          logout(setAuthenticatedUserID, removeCookie);
          return;
        }
        console.log("DATA", data);
        console.log("User from cookies exist, set up done");
        setAuthenticatedUserID(getUserID(cookies));
      }
    );
  }, []);

  return (
    <>
      <Router>
        <AuthenticationContext.Provider value={value}>
          <NavBar className="Nav" />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/play" element={<Play />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/user/:id" element={<Profile />} />
            <Route path="/logout" element={<Logout />} />
          </Routes>
        </AuthenticationContext.Provider>
      </Router>
    </>
  );
}

export default App;
