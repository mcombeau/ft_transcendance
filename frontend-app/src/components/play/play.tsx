import { useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { useNavigate, useParams } from "react-router-dom";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import { AuthenticationContext } from "../authenticationState";
import "./styles.css";

const UP = "ArrowUp";
const DOWN = "ArrowDown";

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

enum StatePlay {
	WaitingForSocket = "waiting for socket",
	NotFound = "not found",
	OnPage = "on page",
	InLobby = "in lobby",
	InGame = "in game",
	Watching = "watching",
	GameEnded = "game ended",
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

function winPage(winnerUsername: string) {
	return (
		<div style={{ textAlign: "center", textEmphasis: "true", color: "green" }}>
			{winnerUsername} won !
		</div>
	);
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
	var inviteID: number = Number(useParams().inviteID);
	var gameID: string = useParams().gameID;
	const [cookies] = useCookies(["token"]);
	const [player1, setPlayer1] = useState<Player>({ id: null, username: "" });
	const [player2, setPlayer2] = useState<Player>({ id: null, username: "" });
	const [statePlay, setStatePlay] = useState<StatePlay>(
		StatePlay.WaitingForSocket
	);
	const { authenticatedUserID } = useContext(AuthenticationContext);
	const navigate = useNavigate();

	function isUserPlaying() {
		return (
			player1.id === authenticatedUserID || player2.id === authenticatedUserID
		);
	}

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
		if (isUserPlaying()) {
			if (event.key === "w" || event.key === UP) {
				event.preventDefault();
				socket.emit("up", cookies["token"]);
			} else if (event.key === "s" || event.key === DOWN) {
				event.preventDefault();
				socket.emit("down", cookies["token"]);
			}
		}
	}

	function enterLobby() {
		console.log("Entered Lobby");
		setStatePlay(StatePlay.InLobby);
		socket.emit("waiting", { token: cookies["token"] });
	}

	function startGame() {
		console.log("Game started");
		if (!gameID) {
			setStatePlay(StatePlay.InGame);
		}
	}

	async function endGame(gameDetails: any) {
		console.log("Game ended");
		setStatePlay(StatePlay.GameEnded);
		await new Promise((r) => setTimeout(r, 2000));
		setStatePlay(StatePlay.WaitingForSocket);
		navigate("/user/" + authenticatedUserID);
	}

	function leaveGame() {
		console.log("Leave game");
		if (statePlay === StatePlay.Watching) {
			socket.emit("stop watching");
			setStatePlay(StatePlay.WaitingForSocket);
			navigate("/user/" + authenticatedUserID);
			return;
		} else {
			socket.emit("leave game", cookies["token"]);
			setStatePlay(StatePlay.WaitingForSocket);
			navigate("/user/" + authenticatedUserID);
		}
	}

	useEffect(() => {
		// TODO: double check they work fine
		if (statePlay !== StatePlay.InGame) return;
		activateKeyHandler(cookies);
		return () => {
			deactivateKeyHandler(cookies);
		};
	}, [statePlay]);

	useEffect(() => {
		socket.on("tick", (data: any) => {
			console.log("tick");
			setGameState(data.gameState);
		});

		socket.on("start game", (data: any) => {
			console.log("Start Game");
			setPlayer1({
				id: data.player1.userID,
				username: data.player1.username,
			});
			setPlayer2({
				id: data.player2.userID,
				username: data.player2.username,
			});
			startGame();
		});

		socket.on("leave game", (userID: number) => {
			if (userID !== authenticatedUserID) {
				console.log("The other player left the game");
				alert("Game ended because the other player left");
				navigate("/user/" + authenticatedUserID);
			}
		});

		socket.on("rejoin game", (data: any) => {
			console.log("rejoined game");
			setPlayer1({
				id: data.player1.userID,
				username: data.player1.username,
			});
			setPlayer2({
				id: data.player2.userID,
				username: data.player2.username,
			});
			startGame();
		});

		socket.on("end game", (gameDetails: any) => {
			endGame(gameDetails);
		});

		socket.on("waiting", (authorized: boolean) => {
			console.log("Waiting socket");
			if (!authorized) {
				setStatePlay(StatePlay.NotFound);
			} else {
				setStatePlay(StatePlay.InLobby);
			}
		});

		socket.on("watch", (authorized: boolean) => {
			console.log("Watching socket");
			if (!authorized) {
				setStatePlay(StatePlay.NotFound);
			} else {
				setStatePlay(StatePlay.Watching);
			}
		});

		return () => {
			socket.off("tick");
			socket.off("watch");
			socket.off("waiting");
			socket.off("start game");
			socket.off("leave game");
			socket.off("rejoin game");
			socket.off("end game");
		};
	}, []);

	useEffect(() => {
		if (inviteID) {
			socket.emit("waiting", { token: cookies["token"], inviteID: inviteID });
		} else if (gameID) {
			socket.emit("watch", { token: cookies["token"], gameID: gameID });
		} else {
			setStatePlay(StatePlay.OnPage);
		}
	}, []);

	useEffect(() => {
		console.log("player1", player1);
		console.log("player2", player2);
	}, [player1, player2]);

	switch (statePlay) {
		case StatePlay.WaitingForSocket:
			return waitForGamePage();

		case StatePlay.NotFound:
			return gameDoesNotExitPage();

		case StatePlay.OnPage:
			return (
				<div>
					<button onClick={enterLobby}>Play</button>
				</div>
			);

		case StatePlay.InLobby:
			return <div>Waiting for other player</div>;

		case StatePlay.GameEnded:
			return winPage("somebody"); // TODO: fix later

		default:
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
									{statePlay === StatePlay.Watching
										? "Stop watching"
										: "Leave game"}
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
					</div>
				</div>
			);
	}
};

export default Play;
