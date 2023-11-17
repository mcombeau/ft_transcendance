import { NavLink } from "react-router-dom";
function Home() {
	return (
		<div>
			<section className="section">
				<div className="box-main">
					<div className="firstHalf">
						<h1 className="text-big">Let's Play PONG !</h1>
						<p className="text-small">
							We made a great implementation of Pong you can play here !
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
						<li>
							<NavLink to="/login">Login</NavLink>
						</li>
					</div>
				</div>
			</section>
			<footer className="footer">
				<p className="text-footer">Copyright ©-All rights are reserved</p>
			</footer>
		</div>
	);
}

export default Home;
