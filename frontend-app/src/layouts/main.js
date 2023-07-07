import Navbar from "../components/navbar/navbar";
import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "../components/home/home";
import Login from "../components/login/login";
import Chat from "../components/chat/chat.tsx";
import Play from "../components/play/play";
import Leaderboard from "../components/leaderboard/leaderboard";

function Main() {
  return (
    <div>
      <HashRouter>
        <Navbar></Navbar>
        <div className="content">
          <Routes>
            <Route exact path="/" element={<Home />} />
            <Route exact path="/login" element={<Login />} />
            <Route exact path="/chat" element={<Chat />} />
            <Route exact path="/play" element={<Play />} />
            <Route exact path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </div>
      </HashRouter>
    </div>
  );
}

export default Main;
