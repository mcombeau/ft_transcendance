import { useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { TbLoader2 } from "react-icons/tb";
import { useNavigate, useParams } from "react-router-dom";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import { AuthenticationContext } from "../authenticationState";
import LiveGames from "../live-games/LiveGames";
import { GameInfo } from "../profile/friendsList";

const UP = "ArrowUp";
const DOWN = "ArrowDown";

type Dimension = {
	width: number;
	height: number;
};

type Response = {
	success: boolean;
	gameInfo?: GameInfo;
};

type Position = {
	x: number;
	y: number;
};

type Step = {
	x: number;
	y: number;
};

type State = {
	score: number[];
	skateTop1: number;
	skateTop2: number;
	live: boolean;
	isPaused: boolean;
	ballPos: Position;
	ballDir: Step;
};

type Player = {
	id: number;
	username: string;
};

export type GameDetails = {
	winnerID: number;
	winnerUsername: string;
	loserID: number;
	loserUsername: string;
	loserScore: number;
	winnerScore: number;
	createdAt?: Date;
};

enum Page {
	Waiting = "waiting",
	Home = "home",
	Lobby = "lobby",
	GameError = "game error",
	Play = "play",
	EndGame = "end game",
}

enum UrlState {
	Play,
	Watch,
	Invite,
}

function gameDoesNotExitPage() {
	return (
		<div className="m-8 text-2xl text-darkblue flex flex-col items-center">
			Game does not exist
		</div>
	);
}

function waitForGamePage() {
	return (
		<div style={{ textAlign: "center", textEmphasis: "true" }}>
			Please wait ...
		</div>
	);
}

function winPage(gameDetails: GameDetails, authenticatedUserID: number) {
	if (!gameDetails) {
		return <p>A player left the game</p>;
	}
	const scoreDisplay = (
		<p>
			({gameDetails.winnerUsername}: {gameDetails.winnerScore} -{" "}
			{gameDetails.loserUsername}: {gameDetails.loserScore})
		</p>
	);
	switch (authenticatedUserID) {
		case gameDetails.winnerID:
			return (
				<>
					<p>You won !</p> {scoreDisplay}
				</>
			);
		case gameDetails.loserID:
			return (
				<>
					<p>You lost !</p> {scoreDisplay}
				</>
			);

		default:
			return (
				<>
					<p>{gameDetails.winnerUsername} won !</p> {scoreDisplay}
				</>
			);
	}
}

export const Play = () => {
	const defaultBallPosition: Position = {
		x: 249,
		y: 225,
	};
	const [gameState, setGameState] = useState<State>({
		score: [0, 0],
		skateTop1: 160,
		skateTop2: 160,
		live: true,
		isPaused: false,
		ballPos: defaultBallPosition,
		ballDir: {
			x: -10,
			y: 10,
		},
	});
	const socket = useContext(WebSocketContext);
	var inviteID: string = useParams().inviteID;
	var watchGameID: string = useParams().watchGameID;
	const [cookies] = useCookies(["token"]);
	const [player1, setPlayer1] = useState<Player>({ id: null, username: "" });
	const [player2, setPlayer2] = useState<Player>({ id: null, username: "" });
	const [endGameDetails, setEndGameDetails] = useState<GameDetails>(null);
	const { authenticatedUserID } = useContext(AuthenticationContext);
	const navigate = useNavigate();
	const [page, setPage] = useState<Page>(Page.Waiting);
	const [watching, setWatching] = useState<boolean>(true);
	const [gameInfos, setGameInfos] = useState<GameInfo[]>([]);

	const sizeGame: number = 2;

	const terrain: Dimension = { width: sizeGame * 700, height: sizeGame * 400 };
	const skate: Dimension = { width: sizeGame * 10, height: sizeGame * 80 };
	const ballRadius: number = sizeGame * 10;
	const skateOffsset1: number = sizeGame * 30;
	const skateOffsset2: number = skateOffsset1 - skate.width;

	function getPlayerUsername(player: number) {
		switch (player) {
			case 1:
				return player1.username;
			case 2:
				return player2.username;
			default:
				return "Player not found";
		}
	}

	function activateKeyHandler(cookies: any) {
		console.log("Key handler activated");
		window.addEventListener("keydown", (event) => {
			handleKeyPress(event, cookies);
		});
	}

	function deactivateKeyHandler(cookies: any) {
		console.log("Key handler deactivated");
		window.removeEventListener("keydown", (event) => {
			handleKeyPress(event, cookies);
		});
	}

	function handleKeyPress(event: any, cookies: any) {
		if (event.key === "w" || event.key === UP) {
			event.preventDefault();
			socket.emit("up", cookies["token"]);
		} else if (event.key === "s" || event.key === DOWN) {
			event.preventDefault();
			socket.emit("down", cookies["token"]);
		}
	}

	function enterLobby() {
		console.log("Entered Lobby");
		setPage(Page.Lobby);
		socket.emit("enter lobby", { token: cookies["token"] });
	}

	async function endGame(gameFinished: boolean, gameDetails?: GameDetails) {
		console.log("Game ended", gameDetails);
		if (gameFinished) {
			setEndGameDetails(gameDetails);
		}
		setPage(Page.EndGame);
	}

	function leaveGame() {
		console.log("Leave game");
		if (watching) {
			socket.emit("stop watching", cookies["token"]);
		} else {
			socket.emit("leave game", cookies["token"]);
		}
		setPage(Page.Waiting);
		navigate("/user/" + authenticatedUserID);
	}

	function setPlayers(gameInfo: GameInfo) {
		setPlayer1({
			id: gameInfo.player1.userID,
			username: gameInfo.player1.username,
		});
		setPlayer2({
			id: gameInfo.player2.userID,
			username: gameInfo.player2.username,
		});
	}

	function leaveLobby() {
		socket.emit("leave lobby", cookies["token"]);
		navigate("/user/" + authenticatedUserID);
	}

	function lobbyPage() {
		return (
			<div className="grid place-content-center">
				<div className=" m-8 text-2xl text-darkblue flex ">
					<div className=" rounded-full p-1 mx-2">
						<TbLoader2 className="animate-spin" />
					</div>
					<div>Waiting for other player... </div>
				</div>
				<button className="button" onClick={leaveLobby}>
					Stop waiting
				</button>
			</div>
		);
	}

	useEffect(() => {
		if (page !== Page.Play) return;
		activateKeyHandler(cookies);
		return () => {
			deactivateKeyHandler(cookies);
		};
	}, [page]);

	function checkUrlState(): UrlState {
		if (watchGameID) return UrlState.Watch;
		if (inviteID) return UrlState.Invite;
		return UrlState.Play;
	}

	useEffect(() => {
		socket.on("reconnect", (data: Response) => {
			if (data.success) {
				console.log("[Reconnect]: reconnected");
				setPage(Page.Play);
				setPlayers(data.gameInfo);
				setWatching(false);
				return;
			}
			console.log("[Reconnect]: fail");

			const urlState: UrlState = checkUrlState();
			switch (urlState) {
				case UrlState.Invite:
					socket.emit("wait invite", {
						token: cookies["token"],
						inviteID: inviteID,
					});
					break;

				case UrlState.Watch:
					socket.emit("watch", {
						token: cookies["token"],
						gameID: watchGameID,
					});
					break;

				default:
					setPage(Page.Home);
			}
		});

		socket.on("watch", (data: Response) => {
			if (!data.success) {
				setPage(Page.GameError);
				return;
			}
			// maybe remove
			setWatching(true);
			setPlayers(data.gameInfo);
			setPage(Page.Play);
		});

		socket.on("wait invite", (data: Response) => {
			if (!data.success) {
				setPage(Page.GameError);
				return;
			}
			setPage(Page.Lobby);
		});

		socket.on("start game", (data: GameInfo) => {
			console.log("Start Game");
			setPlayers(data);
			if (
				data.player1.userID === authenticatedUserID ||
				data.player2.userID === authenticatedUserID
			) {
				setWatching(false);
			} else {
				// maybe unnecessary
				setWatching(true);
			}
			setPage(Page.Play);
		});

		socket.on("tick", (data: any) => {
			console.log("tick");
			const newGameState = {
				score: data.gameState.score,
				skateTop1: sizeGame * data.gameState.skateTop1,
				skateTop2: sizeGame * data.gameState.skateTop2,
				live: data.gameState.live,
				isPaused: data.gameState.isPaused,
				ballPos: {
					x: sizeGame * data.gameState.ballPos.x,
					y: sizeGame * data.gameState.ballPos.y,
				},
				ballDir: {
					x: sizeGame * data.gameState.ballDir.x,
					y: sizeGame * data.gameState.ballDir.y,
				},
			};
			setGameState(newGameState);
		});

		socket.on("leave game", (leavingUserID: number) => {
			if (leavingUserID !== authenticatedUserID) {
				console.log("The other player left the game");
				endGame(false);
			}
		});

		socket.on("end game", (gameDetails: any) => {
			endGame(true, gameDetails);
		});
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

		return () => {
			socket.off("reconnect");
			socket.off("watch");
			socket.off("wait invite");
			socket.off("tick");
			socket.off("start game");
			socket.off("end game");
			socket.off("leave game");
			socket.off("get games");
		};
	}, []);

	useEffect(() => {
		socket.emit("get games", cookies["token"]);
		socket.emit("reconnect", cookies["token"]);
	}, []);

	switch (page) {
		case Page.GameError:
			return gameDoesNotExitPage();

		case Page.Home:
			return (
				<div>
					<div className="grid place-content-center">
						<button
							className="p-4 m-6 px-20 bg-darkblue text-sage rounded-lg text-lg hover:bg-teal"
							onClick={enterLobby}
						>
							Play
						</button>
					</div>
					{LiveGames(
						gameInfos,
						setGameInfos,
						authenticatedUserID,
						socket,
						cookies
					)}
				</div>
			);

		case Page.Lobby:
			return lobbyPage();

		case Page.EndGame:
			return (
				<div className="m-8 text-2xl text-darkblue flex flex-col items-center">
					{winPage(endGameDetails, authenticatedUserID)}
				</div>
			);

		case Page.Play:
			return (
				<div className="absolute bg-sage top-0 bottom-0 left-0 right-0 flex flex-col items-center">
					<div className="bg-lightblue flex flex-col items-center m-4 p-4 rounded-md">
						<div className="bg-darkblue rounded-md m-2 p-2 text-sage flex flex-col items-center">
							<div id="scores">
								<span className="res1">
									{getPlayerUsername(1)} - {gameState.score[0]}
								</span>
								:
								<span className="res2">
									{getPlayerUsername(2)} - {gameState.score[1]}
								</span>
							</div>
						</div>
						<div
							className={`bg-teal relative`}
							style={{
								width: terrain.width,
								height: terrain.height,
							}}
						>
							<div
								className={`absolute bg-sage rounded-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2`}
								style={{
									top: gameState.ballPos.y - ballRadius,
									left: gameState.ballPos.x - ballRadius,
									width: 2 * ballRadius,
									height: 2 * ballRadius,
								}}
							/>
							<div className="absolute top-0 left-1/2 bg-sage w-[2px] h-full" />
							<div className="absolute top-1/2 left-0 bg-sage w-full h-[2px]" />
							<div
								className={`absolute -translate-x-1/2 bg-sage`}
								style={{
									top: gameState.skateTop1,
									left: skateOffsset1,
									width: skate.width,
									height: skate.height,
								}}
							/>
							<div
								className={`absolute  -translate-x-1/2 bg-sage`}
								style={{
									top: gameState.skateTop2,
									right: skateOffsset2,
									width: skate.width,
									height: skate.height,
								}}
							/>
							<div className="gate gate1" />
							<div className="gate gate2" />
						</div>
						<div id="leave button" className="button">
							<button onClick={leaveGame}>
								{watching ? "Stop watching" : "Leave game"}
							</button>
						</div>
					</div>
					<div id="controls" className="text-darkblue">
						<p>
							[Hint]: <br /> Use W or ↑ to move your paddle up and S or ↓ to
							move your paddle down.
						</p>
					</div>
				</div>
			);

		default:
			return waitForGamePage();
	}
};

export default Play;
