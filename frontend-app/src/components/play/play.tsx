import { useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { Navigate, useNavigate, useParams } from "react-router-dom";
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

enum StatePlay {
	OnPage = "on page",
	InLobby = "in lobby",
	InGame = "in game",
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
	const [player1Username, setPlayer1Username] = useState<string>("");
	const [player2Username, setPlayer2Username] = useState<string>("");
	const [statePlay, setStatePlay] = useState<StatePlay>(StatePlay.OnPage);
	const [watching, setWatching] = useState<boolean>(true);
	const [waiting, setWaiting] = useState<boolean>(true);
	const [gameDoesNotExist, setGameDoesNotExist] = useState<boolean>(false);
	const { authenticatedUserID } = useContext(AuthenticationContext);
	const navigate = useNavigate();

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
		if (!watching) {
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
		setStatePlay(StatePlay.InGame);
	}

	function endGame(gameDetails: any) {
		console.log("Game ended");
		if (gameDetails.winnerID === authenticatedUserID) {
			alert("You won !");
		} else {
			alert("You lost ...");
		}

		setStatePlay(StatePlay.OnPage);
	}

	function leaveGame() {
		console.log("Leave game");
		if (watching) {
			socket.emit("stop watching");
			setStatePlay(StatePlay.OnPage);
			navigate("/user/" + authenticatedUserID);
			return;
		}
		socket.emit("leave game", cookies["token"]);
		setStatePlay(StatePlay.OnPage);
	}

	useEffect(() => {
		// TODO: double check they work fine
		activateKeyHandler(cookies);
		return () => {
			deactivateKeyHandler(cookies);
		};
	}, []);

	useEffect(() => {
		if (inviteID) {
			setStatePlay(StatePlay.InLobby);
			socket.emit("waiting", { token: cookies["token"], inviteID: inviteID });
		}
	}, []);

	useEffect(() => {
		socket.on("tick", (data: any) => {
			console.log("tick");
			setPlayer1Username(data.player1.username);
			setPlayer2Username(data.player2.username);
			setGameState(data.gameState);
		});

		socket.on("start game", () => {
			console.log("Received start from back");
			startGame();
		});

		socket.on("leave game", (userID: number) => {
			if (userID !== authenticatedUserID) {
				console.log("The other player left the game");
				alert("Game ended because the other player left");
				setStatePlay(StatePlay.OnPage);
			}
			if (watching) {
				navigate("/user/" + authenticatedUserID);
			}
		});

		socket.on("rejoin game", () => {
			console.log("rejoined game");
			startGame();
		});

		socket.on("end game", (gameDetails: any) => {
			endGame(gameDetails);
		});

		socket.on("watch", (authorized: boolean) => {
			console.log("Watching socket");
			if (!authorized) {
				setGameDoesNotExist(true);
			} else {
				setWatching(true);
				setStatePlay(StatePlay.InGame);
			}
			setWaiting(false);
		});

		return () => {
			socket.off("tick");
			socket.off("watch");
			socket.off("start game");
			socket.off("leave game");
			socket.off("rejoin game");
			socket.off("end game");
		};
	}, []);

	useEffect(() => {
		if (gameID) {
			socket.emit("watch", { token: cookies["token"], gameID: gameID });
		} else {
			setWatching(false);
			setWaiting(false);
		}
	}, []);

	if (waiting) return waitForGamePage();
	if (gameDoesNotExist) return gameDoesNotExitPage();

	if (statePlay === StatePlay.OnPage) {
		return (
			<div>
				<button onClick={enterLobby}>Play</button>
			</div>
		);
	} else if (statePlay === StatePlay.InLobby) {
		return <div>Waiting for other player</div>;
	}
	return (
		<div className="App">
			<div className="center-container">
				<div className="result">
					<span className="res1">
						{player1Username} - {gameState.result[0]}
					</span>
					:
					<span className="res2">
						{player2Username} - {gameState.result[1]}
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
			</div>
		</div>
	);
};

export default Play;
