import { Dispatch, SetStateAction, useEffect } from "react";
import { Socket } from "socket.io-client";
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

function LiveGames(
	gameInfos: GameInfo[],
	setGameInfos: Dispatch<SetStateAction<GameInfo[]>>,
	authenticatedUserID: number,
	socket: Socket,
	cookies: any
) {
	return (
		<div className="background-element">
			<h1 className="title-element">Games currently live !</h1>
			{displayLiveGames(gameInfos)}
		</div>
	);
}

export default LiveGames;
