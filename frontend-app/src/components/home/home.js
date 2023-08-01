import  { NavLink } from "react-router-dom";
import "./home.css"

function Home() {
    return (
        <body>
            <div id="home">
            <section class="section">
                <div class="box-main">
                    <div class="firstHalf">
                        <h1 class="text-big">
                            Pong Game
                        </h1>
                        <p class="text-small">
                            We have made a great implementation of Pong game, which is easy and fun to play.
                        </p>
                    </div>
                </div>
            </section>
            <section class="section">
                <div class="box-main">
                    <div class="secondHalf">
                        <h1 class="text-big" id="program">
                                Let's start playing
                        </h1>
                        <NavLink to="/login"><button class="login" role="login">Login</button></NavLink>
                    </div>
                </div>
            </section>
            <footer class="footer">
                <div class="footer__addr">
                    <h1 class="footer__logo">Ping Pong</h1>
                </div>
                <div class="legal">
                    <p>&copy; 2023 PingPong. All rights reserved.</p>
                    <div class="legal__links">
                        <span>Made with <span class="heart">♥</span> from 42</span>
                    </div>
                </div>
            </footer>
        </div>
    </body>
    )
}

export default Home;
