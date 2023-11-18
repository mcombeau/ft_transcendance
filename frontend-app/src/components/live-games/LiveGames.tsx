import { useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import { AuthenticationContext } from "../authenticationState";
import { GameInfo, linkToGame } from "../profile/friendsList";

function displayLiveGame(game: GameInfo) {
	// TODO: add link to profile
	return (
		<p key={game.socketRoomID}>
			Game between {game.player1.username} and {game.player2.username}{" "}
			{linkToGame(game)}
		</p>
	);
}

function displayLiveGames(games: GameInfo[]) {
	return games.map(displayLiveGame);
}

function LiveGames() {
	const socket = useContext(WebSocketContext);
	const { authenticatedUserID } = useContext(AuthenticationContext);
	const [gameInfos, setGameInfos] = useState<GameInfo[]>([]);
	const [cookies] = useCookies(["token"]);

	useEffect(() => {
		socket.emit("get games", cookies["token"]);
	}, []);

	useEffect(() => {
		socket.on("get games", (data: GameInfo[]) => {
			if (data) {
				setGameInfos(
					data.filter(
						(game: GameInfo) =>
							game.player1.userID !== authenticatedUserID &&
							game.player2.userID !== authenticatedUserID
					)
				);
			}
		});
	}, []);
	return (
		<div>
			<h1>Games currently live !</h1>
			{displayLiveGames(gameInfos)}
		</div>
	);
}

export default LiveGames;
