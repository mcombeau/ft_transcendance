import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { GameDetails } from "../play/play";
import { getLadderLevel, LadderLevels } from "../profile/ladder";

type LeaderboardLine = {
	userID: number;
	username: string;
	ladderLevel: LadderLevels;
	nbWins: number;
	nbLosses: number;
	winDiff: number;
};

function gamesToLeaderboard(games: GameDetails[]) {
	const winners = games.map((game: GameDetails) => {
		return game.winnerID;
	});
	const losers = games.map((game: GameDetails) => {
		return game.loserID;
	});
	const userIDs = Array.from(new Set([...winners, ...losers]));
	console.log("users", userIDs);
	return userIDs
		.map((userID: number) => {
			let username: string;
			const nbWins = games.filter(
				(game: GameDetails) => game.winnerID === userID
			).length;
			const nbLosses = games.filter(
				(game: GameDetails) => game.loserID === userID
			).length;
			const random_game = games.find(
				(game: GameDetails) =>
					game.winnerID === userID || game.loserID === userID
			);
			if (random_game.winnerID == userID) username = random_game.winnerUsername;
			if (random_game.loserID == userID) username = random_game.loserUsername;
			return {
				userID: userID,
				username: username,
				nbWins: nbWins,
				nbLosses: nbLosses,
				winDiff: nbWins - nbLosses,
				ladderLevel: getLadderLevel(nbWins),
			};
		})
		.sort((a, b) => b.winDiff - a.winDiff);
}

function displayLineLeaderboard(leaderboardLine: LeaderboardLine) {
	return (
		<div>
			{leaderboardLine.username} won {leaderboardLine.nbWins} games lost{" "}
			{leaderboardLine.nbLosses} - diff: {leaderboardLine.winDiff}
		</div>
	);
}

function displayLeaderboard(leaderboard: LeaderboardLine[]) {
	if (!leaderboard) return <></>;
	return leaderboard.map(displayLineLeaderboard);
}

function Leaderboard() {
	const [cookies] = useCookies(["token"]);
	const [games, setGames] = useState<GameDetails[]>([]);
	const [leaderboard, setLeaderboard] = useState<LeaderboardLine[]>(null);

	async function fetchLeaderboard() {
		var request = {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${cookies["token"]}`,
			},
		};
		await fetch(`/backend/games`, request).then(async (response) => {
			const data = await response.json();
			if (!response.ok) {
				console.log("Error fetching games");
				return;
			}
			setGames(data);
		});
	}

	useEffect(() => {
		console.log("Games", games);
		setLeaderboard(gamesToLeaderboard(games));
	}, [games]);

	useEffect(() => {
		if (games.length === 0) fetchLeaderboard();
	}, []);

	return (
		<div>
			<h1>Leaderboard</h1>
			{displayLeaderboard(leaderboard)}
		</div>
	);
}

export default Leaderboard;
