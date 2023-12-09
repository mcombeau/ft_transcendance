function Home() {
	return (
		<>
			<div className="background-element flex flex-col">
				<h1 className="title-element">Let's Play PONG!</h1>
				<div className="flex justify-center mb-4">
					<img src="./ft_transcendencee.png"></img>
				</div>
				<p className="px-2 my-2">
					Ft_transcendance is a 42 school team project in which we have built a
					single-page website featuing a real-time multiplayer game of Pong and
					a live chat.
				</p>
				<p className="px-2 my-2">
					This project is made with: [
					<a
						className="underline hover:text-teal"
						href="https://www.docker.com/"
					>
						docker & docker-compose
					</a>
					] - [
					<a className="underline hover:text-teal" href="https://react.dev/">
						React
					</a>
					] - [
					<a className="underline hover:text-teal" href="https://nestjs.com/">
						NestJS
					</a>
					] - [
					<a
						className="underline hover:text-teal"
						href="https://www.postgresql.org/"
					>
						Postgresql
					</a>
					]
				</p>
			</div>
			<div className="background-element">
				<h2 className="title-element">Pong Game</h2>
				<p className="px-2">The game of Pong features:</p>
				<ul className="px-6 m-2 list-disc">
					<li>a responsive, 1v1, 2D multiplayer game of pong,</li>
					<li>a matchmaking system,</li>
					<li>the ability to invite other players to a game,</li>
					<li>the ability to watch other player's matches live,</li>
					<li>customizing the appearance of the game,</li>
					<li>reconnect to the current game in case of network issues</li>
				</ul>
				<div className="flex w-full justify-center">
					<form action="/backend/auth/42login">
						<button className="bg-darkblue text-sage rounded-md m-2 p-2 px-4 whitespace-nowrap">
							Login with 42 to play!
						</button>
					</form>
				</div>
			</div>
			<div className="background-element">
				<h2 className="title-element">Live Chat</h2>
				<p className="px-2">The live chat features:</p>
				<ul className="px-6 m-2 list-disc">
					<li>
						creation of private and public chats, as well as direct messages
						between two users,
					</li>
					<li>
						the ability to block individual users so as not to see messages from
						blocked accounts,
					</li>
					<li>
						the ability for chat room creators to manage their chat rooms:
					</li>
					<ul className="px-6 m-2 list-disc">
						<li>promote others as operators,</li>
						<li>add or change the chat room password,</li>
						<li>toggle the chat room from public to private and vice versa</li>
					</ul>
					<li>the ability for chat room operators and creators to:</li>
					<ul className="px-6 m-2 list-disc">
						<li>kick participants,</li>
						<li>ban participants,</li>
						<li>mute other users for a limited time</li>
					</ul>
					<li>
						a context menu enabling users to challenge others to a game of pong,
						invite them to a chat room, add them as friends, etc.
					</li>
				</ul>
			</div>
			<div className="background-element">
				<h2 className="title-element">User Account and Profile</h2>
				<p className="px-2">On this website, users are able to:</p>
				<ul className="px-6 m-2 list-disc">
					<li>
						create an account via the 42 OAuth API, by logging in with their 42
						student account,
					</li>
					<li>
						enable or disable 2 factor authentication (with, for example, Google
						Authenticator),
					</li>
					<li>customize their profile with a unique username and avatar,</li>
					<li>add and remove friends,</li>
					<li>block or unblock users,</li>
					<li>
						keep track of their stats, match history and leaderboard ranking.
					</li>
				</ul>
			</div>
		</>
	);
}

export default Home;
