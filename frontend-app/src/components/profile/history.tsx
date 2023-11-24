import { useEffect, useState } from "react";
import { getLadderLevel, getLadderLevelDescription } from "./ladder";
import { User } from "./profile";

export type Game = {
	didIWin: boolean;
	otherPlayerID: number;
	otherPlayerName: string;
	date: Date;
	myScore: number;
	otherPlayerScore: number;
};

function displayGame(game: Game, key: number, nbWins: number) {
	const splitDate = game.date.toString().split("T");
	const dateString = splitDate[0] + " " + splitDate[1].split(".")[0];
	let newLadderLevel: string;
	if (getLadderLevel(nbWins - 1) !== getLadderLevel(nbWins) && game.didIWin) {
		newLadderLevel = getLadderLevelDescription(nbWins);
	}

	return (
		<p className="bg-sage m-2 p-2 rounded-md flex justify-between" key={key}>
			<span>
				<span className="uppercase font-bold ">
					{game.didIWin ? "Victory" : "Defeat"}{" "}
				</span>
				<span className="">
					vs{" "}
					<a className="hover:underline" href={"/user/" + game.otherPlayerID}>
						{game.otherPlayerName}
					</a>
				</span>{" "}
			</span>
			<span className="font-bold">
				{game.myScore} - {game.otherPlayerScore}
			</span>{" "}
			<span className="font-light">{dateString}</span>{" "}
			<span>{newLadderLevel ? " - " + newLadderLevel : ""}</span>
		</p>
	);
}

function displayGames(games: Game[]) {
	if (games === undefined) return <div></div>;
	return games
		.sort(
			(a: Game, b: Game) =>
				new Date(a.date).getTime() - new Date(b.date).getTime()
		)
		.map(
			function (game: Game, key: number) {
				if (game.didIWin) this.nbWins++;
				return displayGame(game, key, this.nbWins);
			},
			{ nbWins: 0 }
		)
		.reverse();
}

function displayStat(title: string, value: any) {
	return (
		<div className="flex justify-between border-b border-sage py-2">
			<div className="font-bold">{title}</div>
			<div className="">{value}</div>
		</div>
	);
}

function displayStats(games: Game[]) {
	if (games === undefined) return <div></div>;
	const nbWins = games.filter((game: Game) => game.didIWin === true).length;
	const nbLose = games.filter((game: Game) => game.didIWin === false).length;
	const winrate = nbWins / games.length;
	const averageScore =
		games.map((game: Game) => game.myScore).reduce((p, c) => p + c, 0) /
		games.length;
	return (
		<table className="w-full">
			{displayStat("Ladder Level", getLadderLevelDescription(nbWins))}
			{displayStat("Played games", games.length)}
			{displayStat("Won games", nbWins)}
			{displayStat("Lost games", nbLose)}
			{displayStat("Win Rate", isNaN(winrate) ? "-" : winrate.toFixed(2))}
			{displayStat(
				"Average Score",
				isNaN(averageScore) ? "-" : averageScore.toFixed(2)
			)}
		</table>
	);
}

function GameHistory(user: User, cookies: any) {
	const [games, setGames] = useState<Game[]>();

	async function fetchGames(userID: number, cookies: any) {
		var request = {
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${cookies["token"]}`,
			},
		};
		fetch(`/backend/users/${userID}/games`, request).then(async (response) => {
			const gamesData = await response.json();
			if (!response.ok) {
				console.log("error response load games");
				return <h1>No Games loaded</h1>;
			}
			var fetchedGames = gamesData.map((fetchedGame: any) => {
				const didIWin = fetchedGame.winnerID === userID ? true : false;
				var newGame: Game = {
					didIWin: didIWin,
					otherPlayerID: didIWin ? fetchedGame.loserID : fetchedGame.winnerID,
					otherPlayerName: didIWin
						? fetchedGame.loserUsername
						: fetchedGame.winnerUsername,
					date: fetchedGame.createdAt,
					myScore: didIWin ? fetchedGame.winnerScore : fetchedGame.loserScore,
					otherPlayerScore: didIWin
						? fetchedGame.loserScore
						: fetchedGame.winnerScore,
				};
				return newGame;
			});
			setGames([...fetchedGames]);
		});
	}

	useEffect(() => {
		if (user !== undefined) {
			fetchGames(user.id, cookies);
		}
	}, [user]);

	if (user === undefined) {
		return <div></div>;
	}

	return (
		<>
			<div className="background-element">
				<h3 className="title-element">Stats:</h3>
				{displayStats(games)}
			</div>
			<div className="background-element">
				<h3 className="title-element">History:</h3>
				{displayGames(games)}
			</div>
		</>
	);
}

export default GameHistory;
