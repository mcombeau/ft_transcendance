import { linkToGame } from "../profile/friendsList";
import { GameInfo } from "../play/play";

function displayLiveGame(game: GameInfo) {
	return (
		<tr className="border-b-2 border-lightblue dark:border-darklightblue hover:bg-teal hover:dark:bg-darkteal hover:text-sage hover:dark:text-darksage">
			<td className="p-2 text-center font-bold border-r-2 border-lightblue dark:border-darklightblue border-dashed">
				<a href={`/user/${game.player1.userID}`}>{game.player1.username}</a>
			</td>
			<td className="p-2 text-center font-bold border-r-2 border-lightblue dark:border-darklightblue border-dashed">
				<a href={`/user/${game.player2.userID}`}>{game.player2.username}</a>
			</td>
			<td className="flex p-2 justify-center">{linkToGame(game)}</td>
		</tr>
	);
}

function displayLiveGames(games: GameInfo[]) {
	return games.map(displayLiveGame);
}

function LiveGames(gameInfos: GameInfo[]) {
	return (
		<div className="background-element">
			<h1 className="title-element">Games currently live!</h1>
			{gameInfos.length > 0 ? (
				<div className="rounded-md overflow-hidden">
					<table className="table-auto w-full bg-sage dark:bg-darksage">
						<tbody>
							<tr className="font-bold text-sage dark:text-darksage bg-darkblue dark:bg-darkteal">
								<td className="p-2 text-center">Player 1</td>
								<td className="p-2 text-center">Player 2</td>
								<td className="p-2 text-center">Watch Game</td>
							</tr>
							{displayLiveGames(gameInfos)}
						</tbody>
					</table>
				</div>
			) : (
				<div className="mx-2">No current live games. Check back later!</div>
			)}
		</div>
	);
}

export default LiveGames;
