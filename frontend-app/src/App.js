import "./App.css";
import NavBar from "./components/navbar/navbar";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/home/home";
import Login from "./components/login/login";
import Chat from "./components/chat/Chat";
import Play from "./components/play/play";
import Leaderboard from "./components/leaderboard/leaderboard";
import UserPage from "./components/userpage/userpage";
import { WebSocketContext } from "./contexts/WebsocketContext";

function App() {
  return (
    <>
      <Router>
        <WebSocketContext.Provider>
          <NavBar class="Nav" />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/play" element={<Play />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/user/:name" element={<UserPage />} />
          </Routes>
        </WebSocketContext.Provider>
      </Router>
    </>
  );
}

export default App;
