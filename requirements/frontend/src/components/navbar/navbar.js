import  { NavLink } from "react-router-dom";

function Navbar() {
    return (
		<nav class="navbar background">
                <ul class="nav-list">
                    <div class="logo">
                        <img src=
"https://forums.gamesalad.com/uploads/259/6I2MYLUX1J2S.jpg" alt="logo" />
		</div>
                <li><NavLink exact to="/">Home</NavLink></li>
                <li><NavLink to="/play">Play</NavLink></li>
                <li><NavLink to="/leaderboard">Leaderboard</NavLink></li>
                <li><NavLink to="/chat">Chat</NavLink></li>
                <li><NavLink to="/login">Login</NavLink></li>
            </ul>
		</nav>
    )
}

export default Navbar;
