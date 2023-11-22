import { useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { useNavigate, useParams } from "react-router-dom";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import { AuthenticationContext } from "../authenticationState";
import { GameInfo } from "../profile/friendsList";
import "./styles.css";

const UP = "ArrowUp";
const DOWN = "ArrowDown";

type Response = {
	success: boolean;
	gameInfo?: GameInfo;
};

type Position = {
	x: number;
	y: number;
};

type Step = {
	stepX: number;
	stepY: number;
};

type State = {
	result: number[];
	p1: number;
	p2: number;
	live: boolean;
	isPaused: boolean;
	ballPosition: Position;
	move: Step;
};

type Player = {
	id: number;
	username: string;
};

type GameDetails = {
	winnerID: number;
	winnerUsername: string;
	loserID: number;
	loserUsername: string;
	loserScore: number;
	winnerScore: number;
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
		<div style={{ textAlign: "center", textEmphasis: "true", color: "red" }}>
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

// TODO: @inaara improve css for winpage
function winPage(gameDetails: GameDetails, authenticatedUserID: number) {
	if (!gameDetails) {
		return (
			<div
				style={{ textAlign: "center", textEmphasis: "true", color: "green" }}
			>
				<p>A player left the game</p>
			</div>
		);
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
				<div
					style={{ textAlign: "center", textEmphasis: "true", color: "green" }}
				>
					<p>You won !</p> {scoreDisplay}
				</div>
			);
		case gameDetails.loserID:
			return (
				<div
					style={{ textAlign: "center", textEmphasis: "true", color: "green" }}
				>
					<p>You lost !</p> {scoreDisplay}
				</div>
			);

		default:
			return (
				<div
					style={{ textAlign: "center", textEmphasis: "true", color: "green" }}
				>
					<p>{gameDetails.winnerUsername} won !</p> {scoreDisplay}
				</div>
			);
	}
}

export const Play = () => {
	const defaultBallPosition: Position = {
		x: 249,
		y: 225,
	};
	const [gameState, setGameState] = useState<State>({
		result: [0, 0],
		p1: 160,
		p2: 160,
		live: true,
		isPaused: false,
		ballPosition: defaultBallPosition,
		move: {
			stepX: -10,
			stepY: 10,
		},
	});
	const ballRadius: number = 10;
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
			<div>
				Waiting for other player{" "}
				<button onClick={leaveLobby}>Stop waiting</button>
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
			setGameState(data.gameState);
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

		return () => {
			socket.off("reconnect");
			socket.off("watch");
			socket.off("wait invite");
			socket.off("tick");
			socket.off("start game");
			socket.off("end game");
			socket.off("leave game");
		};
	}, []);

	useEffect(() => {
		socket.emit("reconnect", cookies["token"]);
	}, []);

	switch (page) {
		case Page.GameError:
			return gameDoesNotExitPage();

		case Page.Home:
			return (
				<div>
					<button onClick={enterLobby}>Play</button>
				</div>
			);

		case Page.Lobby:
			return lobbyPage();

		case Page.EndGame:
			return winPage(endGameDetails, authenticatedUserID);

		case Page.Play:
			return (
				<div className="App">
					<div className="center-container">
						<div className="result">
							<span className="res1">
								{getPlayerUsername(1)} - {gameState.result[0]}
							</span>
							:
							<span className="res2">
								{getPlayerUsername(2)} - {gameState.result[1]}
							</span>
							<span>
								<button onClick={leaveGame}>
									{watching ? "Stop watching" : "Leave game"}
								</button>
							</span>
							<div className="gameField">
								<div
									className="ball"
									style={{
										top: gameState.ballPosition.y - ballRadius,
										left: gameState.ballPosition.x - ballRadius,
									}}
								/>
								<div className="midLine" />
								<div className="midLineHor" />
								<div className="player player1" style={{ top: gameState.p1 }} />
								<div className="player player2" style={{ top: gameState.p2 }} />
								<div className="gate gate1" />
								<div className="gate gate2" />
							</div>
						</div>
						<div className="controls">
							<p>
								[Hint]: <br /> Use W or ↑ to move your paddle up and S or ↓ to
								move your paddle down.
							</p>
						</div>
					</div>
				</div>
			);

		default:
			return waitForGamePage();
	}
};

export default Play;
