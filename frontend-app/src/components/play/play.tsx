import { useCallback, useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { TbLoader2 } from "react-icons/tb";
import { useNavigate, useParams } from "react-router-dom";
import { AuthenticationContext } from "../authenticationState";
import LiveGames from "../live-games/LiveGames";
import { useWindowSize } from "@uidotdev/usehooks";
import { ReceivedInfo, typeInvite } from "../chat/types";
import { BannerType, createBanner } from "../banner/Banner";
import { useWebSocket } from "../../contexts/WebsocketContext";

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
	skate1: Position;
	skate2: Position;
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

export type PlayerInfo = {
	userID: number;
	username: string;
};

export type GameInfo = {
	player1: PlayerInfo;
	player2: PlayerInfo;
	socketRoomID: string;
};

enum Page {
	Waiting = "waiting",
	Home = "home",
	Lobby = "lobby",
	GameError = "game error",
	Play = "play",
	EndGame = "end game",
}

enum TerrainColors {
	Teal = "teal",
	LightBlue = "lightblue",
	DarkBlue = "darkblue",
	Black = "black",
}

enum UrlState {
	Play,
	Watch,
	Invite,
}

function gameDoesNotExitPage() {
	return (
		<div className="m-8 flex flex-col items-center background-element">
			<h1 className="title-element">Game does not exist</h1>
			<a className="button" href="/play">
				Back to play
			</a>
		</div>
	);
}

function waitForGamePage() {
	return (
		<div className="grid place-content-center">
			<div className=" m-8 text-2xl text-darkblue dark:text-darkdarkblue flex ">
				<div className=" rounded-full p-1 mx-2">
					<TbLoader2 className="animate-spin" />
				</div>
				<div>Please wait... </div>
			</div>
		</div>
	);
}

function winPage(gameDetails: GameDetails, authenticatedUserID: number) {
	if (!gameDetails) {
		return (
			<>
				<h2 className="title-element">Oops, the game ended !</h2>
				<p>A player left the game</p>
				<a className="button" href="/play">
					Back to play
				</a>
			</>
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
				<>
					<h2 className="title-element">You won !</h2> {scoreDisplay}{" "}
					<a className="button" href="/play">
						Play again!
					</a>
				</>
			);
		case gameDetails.loserID:
			return (
				<>
					<h2 className="title-element">You lost !</h2> {scoreDisplay}{" "}
					<a className="button" href="/play">
						Play again!
					</a>
				</>
			);

		default:
			return (
				<>
					<h2 className="" title-element>
						{gameDetails.winnerUsername} won !
					</h2>
					{scoreDisplay}
					<a className="button" href="/play">
						Back to play
					</a>
				</>
			);
	}
}

export const Play = ({ setBanners }) => {
	const defaultBallPosition: Position = {
		x: 249,
		y: 225,
	};
	const [gameState, setGameState] = useState<State>({
		score: [0, 0],
		skate1: { x: 15, y: 160 },
		skate2: { x: 685, y: 160 },
		live: true,
		isPaused: false,
		ballPos: defaultBallPosition,
		ballDir: {
			x: -10,
			y: 10,
		},
	});
	const socket = useWebSocket();
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

	const [terrainColor, setTerrainColor] = useState<TerrainColors>(
		TerrainColors.Teal
	);

	const windowSize = useWindowSize();
	const [sizeGame, setSizeGame] = useState<number>(1);
	const [terrain, setTerrain] = useState<Dimension>({
		width: sizeGame * 700,
		height: sizeGame * 400,
	});
	const [skate, setSkate] = useState<Dimension>({
		width: sizeGame * 10,
		height: sizeGame * 80,
	});
	const [ballRadius, setBallRadius] = useState<number>(sizeGame * 10);
	const [skateOffsset1, setSkateOffsset1] = useState<number>(sizeGame * 30);
	const [, setSkateOffsset2] = useState<number>(skateOffsset1 - skate.width);

	useEffect(() => {
		let newSize: number = 1;
		if (windowSize.width < 768 || windowSize.height < 640) {
			newSize = 0.5;
		} else if (
			(windowSize.width >= 768 && windowSize.width < 1280) ||
			(windowSize.height >= 640 && windowSize.height < 768)
		) {
			newSize = 1;
		} else if (windowSize.width >= 1280 || windowSize.height >= 768) {
			newSize = 1.5;
		}
		setSizeGame(newSize);
		setBallRadius(newSize * 10);
		setTerrain({
			width: newSize * 700,
			height: newSize * 400,
		});
		setSkate({
			width: newSize * 10,
			height: newSize * 80,
		});
		setSkateOffsset1(newSize * 30);
		setSkateOffsset2(newSize * 30 - newSize * 10);
	}, [windowSize]);

	useEffect(() => {
		if (!authenticatedUserID) {
			navigate("/not-found");
		}
	}, [authenticatedUserID, navigate]);

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

	function getPlayerID(player: number) {
		switch (player) {
			case 1:
				return player1.id;
			case 2:
				return player2.id;
			default:
				return null;
		}
	}

	const handleKeyPress = useCallback(
		(event: any) => {
			if (event.key === "w" || event.key === "k" || event.key === UP) {
				event.preventDefault();
				socket.emit("up");
			} else if (event.key === "s" || event.key === "j" || event.key === DOWN) {
				event.preventDefault();
				socket.emit("down");
			}
		},
		[socket]
	);

	const activateKeyHandler = useCallback(() => {
		window.addEventListener("keydown", (event) => {
			handleKeyPress(event);
		});
	}, [handleKeyPress]);

	const deactivateKeyHandler = useCallback(() => {
		window.removeEventListener("keydown", (event) => {
			handleKeyPress(event);
		});
	}, [handleKeyPress]);

	function enterLobby() {
		setPage(Page.Lobby);
		socket.emit("reconnect");
		socket.emit("enter lobby");
	}

	async function endGame(gameFinished: boolean, gameDetails?: GameDetails) {
		if (gameFinished) {
			setEndGameDetails(gameDetails);
		}
		setPage(Page.EndGame);
	}

	function leaveGame() {
		if (watching) {
			socket.emit("stop watching");
		} else {
			socket.emit("leave game");
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
		socket.emit("leave lobby");
		navigate("/user/" + authenticatedUserID);
	}

	function lobbyPage() {
		return (
			<div className="grid place-content-center">
				<div className=" m-8 text-2xl text-darkblue dark:text-darkdarkblue flex ">
					<div className=" rounded-full p-1 mx-2">
						<TbLoader2 className="animate-spin" />
					</div>
					<div>Waiting for other player... </div>
				</div>
				<button
					className="button dark:bg-darkteal hover:dark:bg-darklightblue hover:dark:text-darkdarkblue"
					onClick={leaveLobby}
				>
					Stop waiting
				</button>
			</div>
		);
	}

	useEffect(() => {
		if (page !== Page.Play) return;
		activateKeyHandler();
		return () => {
			deactivateKeyHandler();
		};
	}, [page, activateKeyHandler, deactivateKeyHandler]);

	const checkUrlState = useCallback((): UrlState => {
		if (watchGameID) return UrlState.Watch;
		if (inviteID) return UrlState.Invite;
		return UrlState.Play;
	}, [inviteID, watchGameID]);

	useEffect(() => {
		if (socket) {
			socket.on("reconnect", (data: Response) => {
				console.log("Reconnect", data);
				if (data.success) {
					setPage(Page.Play);
					setPlayers(data.gameInfo);
					setWatching(false);
					return;
				}

				const urlState: UrlState = checkUrlState();
				switch (urlState) {
					case UrlState.Invite:
						socket.emit("wait invite", {
							inviteID: inviteID,
						});
						break;

					case UrlState.Watch:
						socket.emit("watch", {
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

			socket.on("refuse invite", (info: ReceivedInfo) => {
				if (info.inviteInfo.type !== typeInvite.Game) {
					return;
				}
				createBanner(
					`${info.inviteInfo.invitedUsername} has refused your game invite.`,
					setBanners,
					BannerType.Alert
				);
				leaveLobby();
			});

			socket.on("start game", (data: GameInfo) => {
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
				setSizeGame((prev: number) => {
					const newGameState = {
						score: data.gameState.score,
						skate1: {
							x: prev * data.gameState.skate1.x,
							y: prev * data.gameState.skate1.y,
						},
						skate2: {
							x: prev * data.gameState.skate2.x,
							y: prev * data.gameState.skate2.y,
						},
						live: data.gameState.live,
						isPaused: data.gameState.isPaused,
						ballPos: {
							x: prev * data.gameState.ballPos.x,
							y: prev * data.gameState.ballPos.y,
						},
						ballDir: {
							x: prev * data.gameState.ballDir.x,
							y: prev * data.gameState.ballDir.y,
						},
					};
					setGameState(newGameState);
					return prev;
				});
			});

			socket.on("leave game", (leavingUserID: number) => {
				if (leavingUserID !== authenticatedUserID) {
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
		}

		return () => {
			if (socket) {
				socket.off("reconnect");
				socket.off("watch");
				socket.off("wait invite");
				socket.off("refuse invite");
				socket.off("tick");
				socket.off("start game");
				socket.off("end game");
				socket.off("leave game");
				socket.off("get games");
			}
		};
	}, [
		authenticatedUserID,
		checkUrlState,
		cookies,
		inviteID,
		sizeGame,
		socket,
		watchGameID,
	]);

	useEffect(() => {
		if (socket) {
			socket.emit("get games");
			socket.emit("reconnect");
			console.log("Reconnect", data);
		}
	}, [socket, cookies]);

	switch (page) {
		case Page.GameError:
			return gameDoesNotExitPage();

		case Page.Home:
			return (
				<div>
					<div className="grid place-content-center">
						<button
							className="p-4 m-6 px-20 font-bold bg-darkblue dark:bg-darkteal text-sage dark:text-darksage rounded-lg text-lg hover:bg-teal hover:dark:bg-darklightblue hover:dark:text-darkdarkblue"
							onClick={enterLobby}
						>
							Play
						</button>
					</div>
					{LiveGames(gameInfos)}
				</div>
			);

		case Page.Lobby:
			return lobbyPage();

		case Page.EndGame:
			return (
				<div className="m-8 flex flex-col items-center background-element">
					{winPage(endGameDetails, authenticatedUserID)}
				</div>
			);

		case Page.Play:
			return (
				<div className="absolute bg-sage dark:bg-darksage top-0 bottom-0 left-0 right-0 flex flex-col items-center">
					<div className="bg-lightblue dark:bg-darklightblue flex flex-col items-center m-4 p-4 rounded-md">
						<div className="grid grid-cols-2 text-darkblue dark:text-darkdarkblue mb-4 w-full space-x-2">
							<div
								className={`grid grid-cols-2 space-x-2  rounded-md p-1 ${
									authenticatedUserID === getPlayerID(1)
										? "border-2 border-teal dark:border-darkteal"
										: ""
								}`}
							>
								<div
									className={`bg-sage dark:bg-darksage  rounded-md p-2 text-center font-bold`}
								>
									{getPlayerUsername(1)}
								</div>
								<div className="bg-sage dark:bg-darksage w-30 rounded-md p-2 text-center">
									{gameState.score[0]}
								</div>
							</div>
							<div
								className={`grid grid-cols-2  space-x-2 rounded-md p-1 ${
									authenticatedUserID === getPlayerID(2)
										? "border-2 border-teal dark:border-darkteal "
										: ""
								}`}
							>
								<div className="bg-sage dark:bg-darksage w-30 rounded-md p-2 text-center">
									{gameState.score[1]}
								</div>
								<div
									className={`bg-sage dark:bg-darksage rounded-md p-2 text-center font-bold`}
								>
									{getPlayerUsername(2)}
								</div>
							</div>
						</div>
						<div
							id="terrain"
							className={`bg-${terrainColor} ${
								terrainColor === TerrainColors.LightBlue
									? "border-2 border-sage"
									: ""
							} relative rounded-md`}
							style={{
								width: terrain.width,
								height: terrain.height,
							}}
						>
							<div
								id="ball"
								className={`absolute bg-sage rounded-sm -translate-x-1/2 -translate-y-1/2 shadow-md shadow-darkblue z-30`}
								style={{
									top: gameState.ballPos.y,
									left: gameState.ballPos.x,
									width: 2 * ballRadius,
									height: 2 * ballRadius,
								}}
							/>
							<div
								id="left goal"
								className="absolute top-0 border-l-2 border-sage border-solid border-opacity-25 h-full"
								style={{
									left: gameState.skate1.x + skate.width * 0.5 - 1,
								}}
							/>
							<div
								id="right goal"
								className="absolute top-0 border-l-2 border-sage border-solid border-opacity-25 h-full"
								style={{
									left: gameState.skate2.x - skate.width * 0.5 - 1,
								}}
							/>
							<div
								id="vertical divider"
								className="absolute top-0 left-1/2 border-l-2 border-sage border-dashed h-full"
							/>
							<div
								id="horizontal divider"
								className="absolute top-1/2 left-0 border-t-2 border-sage border-solid w-full"
							/>
							<div
								id="skate1"
								className={`absolute bg-sage rounded-sm shadow-md shadow-darkblue`}
								style={{
									top: gameState.skate1.y,
									left: gameState.skate1.x,
									width: skate.width,
									height: skate.height,
								}}
							/>
							<div
								id="skate2"
								className={`absolute bg-sage rounded-sm shadow-md shadow-darkblue`}
								style={{
									top: gameState.skate2.y,
									left: gameState.skate2.x - skate.width,
									width: skate.width,
									height: skate.height,
								}}
							/>
						</div>
						<div className="flex items-center w-full justify-between">
							<div id="leave button" className="button">
								<button className="px-2 py-1" onClick={leaveGame}>
									{watching ? "Stop watching" : "Leave game"}
								</button>
							</div>
							<div id="color buttons" className="flex justify-end">
								<button
									id="lightblue button"
									className={`bg-${TerrainColors.LightBlue} w-6 h-6 m-1 rounded-md border-2 border-sage`}
									onClick={() => {
										setTerrainColor(TerrainColors.LightBlue);
									}}
								></button>
								<button
									id="teal button"
									className={`bg-${TerrainColors.Teal} w-6 h-6 m-1 rounded-md border-2 border-sage`}
									onClick={() => {
										setTerrainColor(TerrainColors.Teal);
									}}
								></button>
								<button
									id="black button"
									className={`bg-${TerrainColors.DarkBlue} w-6 h-6 m-1 rounded-md border-2 border-sage`}
									onClick={() => {
										setTerrainColor(TerrainColors.DarkBlue);
									}}
								></button>
							</div>
						</div>
					</div>
					<div id="controls" className="text-darkblue">
						<p className="text-sm">
							[Hint]: Use W or K or ↑ to move your paddle up and S or J or ↓ to
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
