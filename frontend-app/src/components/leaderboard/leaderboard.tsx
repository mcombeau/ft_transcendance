import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { GameDetails } from "../play/play";

function Leaderboard() {
	const [cookies] = useCookies(["token"]);
	const [games, setGames] = useState<GameDetails[]>([]);

	async function fetchLeaderboard() {
		var request = {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${cookies["token"]}`,
			},
		};
		await fetch(`http://localhost/backend/games`, request).then(
			async (response) => {
				const data = await response.json();
				if (!response.ok) {
					console.log("Error fetching games");
					return;
				}
				setGames(data);
			}
		);
	}

	useEffect(() => {
		console.log("Games", games);
	}, [games]);

	useEffect(() => {
		if (games.length === 0) fetchLeaderboard();
	}, []);

	return <h1>Leaderboard</h1>;
}

export default Leaderboard;
