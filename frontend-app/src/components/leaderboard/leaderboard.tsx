import { useCallback, useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { GameDetails } from "../play/play";
import { getLadderLevel, LadderLevels } from "../profile/ladder";
import { AuthenticationContext } from "../authenticationState";

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
			if (random_game.winnerID === userID)
				username = random_game.winnerUsername;
			if (random_game.loserID === userID) username = random_game.loserUsername;
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

function displayLineLeaderboard(
	authenticatedUserID: number,
	leaderboardLine: LeaderboardLine,
	index: number
) {
	return (
		<tr
			key={index}
			className={`${
				authenticatedUserID == leaderboardLine.userID
					? "bg-lightblue dark:bg-darklightblue text-darkblue dark:text-darkdarkblue border-x-2 border-b-2 border-sage dark:border-darksage"
					: "border-b-2 border-lightblue dark:border-darklightblue"
			} hover:bg-teal dark:hover:bg-darkteal hover:text-sage hover:dark:text-darksage hover:dark:border-t-2 hover:dark:border-darklightblue`}
		>
			<td
				className={`p-2 text-center font-bold ${
					authenticatedUserID == leaderboardLine.userID
						? "border-r-2 border-sage dark:border-darksage border-dashed"
						: "border-r-2 border-lightblue dark:border-darklightblue border-dashed "
				}`}
			>
				{index + 1}
			</td>
			<td
				className={`flex p-2 justify-center ${
					authenticatedUserID == leaderboardLine.userID
						? "border-r-2 border-sage dark:border-darksage border-dashed"
						: "border-r-2 border-lightblue dark:border-darklightblue border-dashed "
				}`}
			>
				{authenticatedUserID ? (
					<a className="font-bold m-2" href={"/user/" + leaderboardLine.userID}>
						{leaderboardLine.username}
					</a>
				) : (
					<p className="font-bold m-2">{leaderboardLine.username}</p>
				)}
			</td>
			<td
				className={`p-2 text-center ${
					authenticatedUserID == leaderboardLine.userID
						? "border-r-2 border-sage dark:border-darksage border-dashed"
						: "border-r-2 border-lightblue dark:border-darklightblue border-dashed "
				}`}
			>
				{leaderboardLine.nbWins}
			</td>
			<td
				className={`p-2 text-center ${
					authenticatedUserID == leaderboardLine.userID
						? "border-r-2 border-sage dark:border-darksage border-dashed"
						: "border-r-2 border-lightblue dark:border-darklightblue border-dashed "
				}`}
			>
				{leaderboardLine.nbLosses}
			</td>
			<td className="p-2 text-center">{leaderboardLine.winDiff}</td>
		</tr>
	);
}

function displayLeaderboard(
	authenticatedUserID: number,
	leaderboard: LeaderboardLine[]
) {
	if (!leaderboard) return <></>;
	return (
		<div className="rounded-md overflow-hidden">
			<table className="table-auto w-full bg-sage dark:bg-darksage ">
				<tbody>
					<tr
						key="header"
						className="font-bold text-sage dark:text-darksage bg-darkblue dark:bg-darkteal"
					>
						<td className="p-2 text-center">Rank</td>
						<td className="p-2 text-center">User</td>
						<td className="p-2 text-center">Wins</td>
						<td className="p-2 text-center">Losses</td>
						<td className="p-2 text-center">Diff</td>
					</tr>
					{leaderboard.map((leaderboardLine: LeaderboardLine, index: number) =>
						displayLineLeaderboard(authenticatedUserID, leaderboardLine, index)
					)}
				</tbody>
			</table>
		</div>
	);
}

function Leaderboard() {
	const [cookies] = useCookies(["token"]);
	const [games, setGames] = useState<GameDetails[]>([]);
	const [leaderboard, setLeaderboard] = useState<LeaderboardLine[]>(null);
	const { authenticatedUserID } = useContext(AuthenticationContext);

	const fetchLeaderboard = useCallback(async () => {
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
				console.warn("Error fetching games");
				return;
			}
			setGames(data);
		});
	}, [cookies]);

	useEffect(() => {
		setLeaderboard(gamesToLeaderboard(games));
	}, [games]);

	useEffect(() => {
		if (games.length === 0) fetchLeaderboard();
	}, [fetchLeaderboard, games]);

	return (
		<div className="background-element">
			<h1 className="title-element">Leaderboard</h1>
			{displayLeaderboard(authenticatedUserID, leaderboard)}
		</div>
	);
}

export default Leaderboard;
