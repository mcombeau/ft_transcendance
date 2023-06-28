import  { NavLink } from "react-router-dom";

function Navbar() {
    return (
        <div className="navbar">
            <h1>Navbar</h1>
            <ul>
                <li><NavLink exact to="/">Home</NavLink></li>
                <li><NavLink to="/contact">Contact</NavLink></li>
                <li><NavLink to="/about">About</NavLink></li>
            </ul>
        </div>
    )
}

export default Navbar;
