import "./App.css";
import NavBar from "./components/navbar/navbar";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/home/home";
import Login from "./components/login/login";
import Chat from "./components/chat/chat";
import Play from "./components/play/play";
import Leaderboard from "./components/leaderboard/leaderboard";
import UserPage from "./components/userpage/userpage";

function App() {
  return (
    <>
      <Router>
        <NavBar class="Nav" />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/play" element={<Play />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/user/:name" element={<UserPage />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
