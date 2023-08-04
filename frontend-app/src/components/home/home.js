import  { NavLink } from "react-router-dom";
import "./home.css"

function Home() {
    return (
        <div id="home">
            <section className="section">
                <div className="box-main">
                    <div className="firstHalf">
                        <h1 className="text-big">
                            Pong Game
                        </h1>
                        <p className="text-small">
                            We have made a great implementation of Pong game, which is easy and fun to play.
                        </p>
                    </div>
                </div>
            </section>
            <section className="section">
                <div className="box-main">
                    <div className="secondHalf">
                        <h1 className="text-big" id="program">
                                Let's start playing
                        </h1>
                        <NavLink to="/login"><button className="login" role="login">Login</button></NavLink>
                    </div>
                </div>
            </section>
            <footer className="footer">
                <div className="footer__addr">
                    <h1 className="footer__logo">Ping Pong</h1>
                </div>
                <div className="legal">
                    <p>&copy; 2023 PingPong. All rights reserved.</p>
                    <div className="legal__links">
                        <span>Made with <span className="heart">♥</span> from 42</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Home;
