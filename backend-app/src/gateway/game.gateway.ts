import { OnModuleInit, Inject, forwardRef, Logger } from "@nestjs/common";
import {
	ConnectedSocket,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { Server } from "socket.io";
import { GamesService } from "src/games/games.service";
import { Socket } from "socket.io";
import { MessageBody } from "@nestjs/websockets";
import { createGameParams } from "src/games/utils/types";
import { UserEntity, userStatus } from "src/users/entities/user.entity";
import { UsersService } from "src/users/users.service";
import { UserNotFoundError } from "src/exceptions/not-found.interceptor";
import { InvitesService } from "src/invites/invites.service";
import { sendInviteDto } from "src/invites/dtos/sendInvite.dto";
import { isInt, isPositive } from "class-validator";
import { SocketGateway } from "./socket.gateway";
import { PermissionChecks } from "./permission-checks";

// TODO: move constants here (game speed ...)
const WINNING_SCORE = 4;

type Player = {
	userID: number;
	username: string;
	socket?: Socket;
	inviteID?: number;
};

type Watcher = Player;

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

type GameRoom = {
	player1: Player;
	player2: Player;
	socketRoomID: string;
	gameState: State;
	interval: NodeJS.Timeout;
	watchers: Watcher[];
};

type PlayerInfo = {
	userID: number;
	username: string;
};

type GameInfo = {
	player1: PlayerInfo;
	player2: PlayerInfo;
	socketRoomID: string;
};

type Response = {
	success: boolean;
	gameInfo?: GameInfo;
};

@WebSocketGateway({
	cors: {
		origin: [
			"http://localhost:3000",
			"http://localhost",
			process.env.FT_TRANSCENDANCE_DOMAIN,
		],
	},
})
export class GameGateway implements OnModuleInit {
	constructor(
		@Inject(forwardRef(() => GamesService))
		private gameService: GamesService,
		@Inject(forwardRef(() => UsersService))
		private usersService: UsersService,
		@Inject(forwardRef(() => InvitesService))
		private invitesService: InvitesService,
		@Inject(forwardRef(() => PermissionChecks))
		private permissionChecks: PermissionChecks,
		@Inject(forwardRef(() => SocketGateway))
		private socketGateway: SocketGateway
	) {}
	@WebSocketServer()
	server: Server;
	delay: number;
	player1x: number;
	player2x: number;
	pHeight: number;
	gateHeight: number;
	gateY: number;
	p1GateX: number;
	p2GateX: number;
	playerMaxY: number;
	playerMinY: number;
	ballRadius: number;
	bottomBoundary: number;
	topBoundary: number;
	leftBoundary: number;
	rightBoundary: number;
	step: number;
	gameRooms: GameRoom[];
	waitList: Player[];
	gameRoomID: number;

	private readonly logger: Logger = new Logger("Game Gateway");

	onModuleInit() {
		this.delay = 6;
		this.player1x = 42;
		this.player2x = 660;
		this.pHeight = 80;
		this.gateHeight = 160;
		this.gateY = 100;
		this.p1GateX = 3;
		this.p2GateX = 697;
		this.playerMaxY = 400;
		this.playerMinY = 0;
		this.ballRadius = 10;
		this.bottomBoundary = 410;
		this.topBoundary = 10;
		this.leftBoundary = 5;
		this.rightBoundary = 710;
		this.step = 7;
		this.gameRooms = [];
		this.waitList = [];
		this.gameRoomID = 0;
	}

	private startGame(gameRoom: GameRoom) {
		this.logger.log(
			`[Start Game]: game starting (${gameRoom.player1.username} - ${gameRoom.player2.username})`
		);
		this.server
			.to(gameRoom.socketRoomID)
			.emit("start game", this.gameToGameInfo(gameRoom));
		this.randomInitialMove(gameRoom.gameState);

		gameRoom.interval = setInterval(() => {
			this.tick(gameRoom);
			this.server.to(gameRoom.socketRoomID).emit("tick", gameRoom);
		}, this.delay);
	}

	private createGameDetails(gameRoom: GameRoom): createGameParams {
		let gameDetails: createGameParams;
		if (gameRoom.gameState.result[0] === WINNING_SCORE) {
			gameDetails = {
				winnerID: gameRoom.player1.userID,
				winnerUsername: gameRoom.player1.username,
				loserID: gameRoom.player2.userID,
				loserUsername: gameRoom.player2.username,
				loserScore: gameRoom.gameState.result[1],
				winnerScore: WINNING_SCORE,
			};
		} else {
			gameDetails = {
				winnerID: gameRoom.player2.userID,
				winnerUsername: gameRoom.player2.username,
				loserID: gameRoom.player1.userID,
				loserUsername: gameRoom.player1.username,
				loserScore: gameRoom.gameState.result[0],
				winnerScore: WINNING_SCORE,
			};
		}
		return gameDetails;
	}

	private async stopGame(
		gameRoom: GameRoom,
		isGameFinished: boolean,
		leavingUserID?: number
	) {
		this.logger.debug(
			`[Stop Game]: game stopping (${gameRoom.player1.username} - ${gameRoom.player2.username})`
		);

		clearInterval(gameRoom.interval);

		if (isGameFinished) {
			const gameDetails: createGameParams = this.createGameDetails(gameRoom);
			this.server.to(gameRoom.socketRoomID).emit("end game", gameDetails);
			await this.gameService.saveGame(gameDetails);
		} else {
			this.server.to(gameRoom.socketRoomID).emit("leave game", leavingUserID);
		}

		this.server.in(gameRoom.socketRoomID).socketsLeave(gameRoom.socketRoomID);
		this.gameRooms = this.gameRooms.filter(
			(gr: GameRoom) => gr.socketRoomID !== gameRoom.socketRoomID
		);

		await this.updatePlayerStatus(userStatus.ONLINE, gameRoom.player1.userID);
		await this.updatePlayerStatus(userStatus.ONLINE, gameRoom.player2.userID);
	}

	getCurrentPlayRoom(userID: number) {
		for (let i = this.gameRooms.length - 1; i >= 0; i--) {
			const gameRoom = this.gameRooms[i];
			if (
				gameRoom.player1.userID === userID ||
				gameRoom.player2.userID === userID
			) {
				return gameRoom;
			}
		}
		return null;
	}

	private getRoomByID(gameID: string): GameRoom {
		return this.gameRooms.find((gameRoom: GameRoom) => {
			return gameRoom.socketRoomID === gameID;
		});
	}

	private async updatePlayerStatus(userStatus: userStatus, userID: number) {
		await this.usersService.updateUserByID(userID, { status: userStatus });
		this.server.emit("status change", {
			userID: userID,
			userStatus: userStatus,
		});
	}

	getWatchingRooms(userID: number) {
		return this.gameRooms.filter((gameRoom: GameRoom) => {
			return gameRoom.watchers.some((watcher: Watcher) => {
				return watcher.userID === userID;
			});
		});
	}

	private async stopWatchingAllGames(
		userID: number,
		socket: Socket
	): Promise<void> {
		const gamesAlreadyWatched: GameRoom[] = this.getWatchingRooms(userID);

		await Promise.all(
			gamesAlreadyWatched.map(async (gameRoom: GameRoom) => {
				return await this.rmWatcherFromGameRoom(
					userID,
					gameRoom.socketRoomID,
					socket
				);
			})
		);
	}

	private async rmWatcherFromGameRoom(
		userID: number,
		gameID: string,
		socket: Socket
	) {
		const gameRoom: GameRoom = this.gameRooms.find((gameRoom: GameRoom) => {
			gameRoom.socketRoomID == gameID;
			return gameRoom;
		});
		if (!gameRoom) return;
		gameRoom.watchers = gameRoom.watchers.filter(
			(watcher: Watcher) => watcher.userID !== userID
		);
		socket.leave(gameRoom.socketRoomID);
	}

	private async addWatcherToGameRoom(
		watcher: Watcher,
		gameRoom: GameRoom
	): Promise<void> {
		await watcher.socket.join(gameRoom.socketRoomID);
		delete watcher.socket;
		gameRoom.watchers.push(watcher);
	}

	private placeBall() {
		return { x: 250, y: 250 };
	}

	private createGameState() {
		return {
			result: [0, 0],
			p1: 160,
			p2: 160,
			live: true,
			isPaused: false,
			ballPosition: this.placeBall(),
			move: {
				stepX: -1,
				stepY: 1,
			},
		};
	}

	private async reconnect(socket: Socket, userID: number): Promise<GameRoom> {
		const myGameRoom: GameRoom = this.getCurrentPlayRoom(userID);
		if (!myGameRoom) {
			return null;
		}
		await this.updatePlayerStatus(userStatus.INGAME, userID);
		await socket.join(myGameRoom.socketRoomID);
		this.logger.debug(
			`[Reconnect]: setting up user ${userID} to join game room ${myGameRoom.socketRoomID}`
		);
		return myGameRoom;
	}

	private async clearAcceptedInvite(
		player1: Player,
		player2: Player
	): Promise<void> {
		if (!player1.inviteID && !player2.inviteID) {
			return;
		}
		if (
			player1.inviteID &&
			player2.inviteID &&
			player1.inviteID === player2.inviteID
		) {
			this.logger.debug(
				`[Clear Accepted Invite]: clearing invite ${player1.inviteID} for user ${player1.username}`
			);
			await this.invitesService.deleteInviteByID(player1.inviteID);
		} else {
			throw new Error("Player invites mismatched! (clear accepted invite)");
		}
	}

	private async createRoom(
		player1: Player,
		player2: Player
	): Promise<GameRoom> {
		const socketRoomID = this.gameRoomID.toString();
		this.gameRoomID++;

		await this.clearAcceptedInvite(player1, player2);
		this.logger.debug(
			`[Create Game Room]: Creating game room of id ${socketRoomID}, with player1 ${player1.userID} of username ${player1.username} and player2 ${player2.userID} of username ${player2.username}`
		);
		await player1.socket.join(socketRoomID);
		await player2.socket.join(socketRoomID);
		delete player1.socket;
		delete player2.socket;
		await this.updatePlayerStatus(userStatus.INGAME, player1.userID);
		await this.updatePlayerStatus(userStatus.INGAME, player2.userID);
		const gameRoom: GameRoom = {
			player1: player1,
			player2: player2,
			socketRoomID: socketRoomID,
			gameState: this.createGameState(),
			interval: null,
			watchers: [],
		};
		this.gameRooms.push(gameRoom);
		return gameRoom;
	}

	private getFreePlayer(waitingPlayer: Player): Player {
		for (let i = 0; i < this.waitList.length; i++) {
			const player = this.waitList[i];
			if (!player.inviteID && player.userID !== waitingPlayer.userID) {
				this.waitList.splice(i, 1);
				return player;
			}
		}
		return null;
	}

	private getInvitedPlayer(player: Player): Player {
		for (let i = 0; i < this.waitList.length; i++) {
			const opponent = this.waitList[i];
			if (
				opponent.inviteID === player.inviteID &&
				opponent.userID !== player.userID
			) {
				this.logger.debug(
					`[Get Invited Player]: Found opponent ${opponent.username} with invite ${opponent.inviteID} for player ${player.username} with invite ${player.inviteID}`
				);
				this.waitList.splice(i, 1);
				return opponent;
			}
		}
		return null;
	}

	private async getRoomOrWait(player: Player, isAcceptingInvite?: boolean) {
		let opponent: Player;
		if (player.inviteID) {
			opponent = this.getInvitedPlayer(player);
		} else {
			opponent = this.getFreePlayer(player);
		}
		if (opponent) {
			this.logger.debug(
				`[Get Room or Wait]: Found opponent ${opponent.username} with invite ${opponent.inviteID}`
			);
			return this.createRoom(player, opponent);
		}
		this.logger.debug(
			`[Get Room or Wait]: Did not find opponent for ${player.username} with invite ${player.inviteID}`
		);
		if (!isAcceptingInvite) {
			this.waitList.push(player);
		}
		return null;
	}

	randomInitialMove(gameState: State) {
		// pseudo-random ball behavior
		const moves = [
			{ stepX: 1, stepY: 1 },
			{ stepX: 1, stepY: 2 },
			{ stepX: 2, stepY: 1 },
			{ stepX: -1, stepY: -1 },
			{ stepX: -1, stepY: 1 },
		];
		const initialMove = moves[Math.floor(Math.random() * moves.length)];
		gameState.move = initialMove;
	}

	checkGoals(gameState: State) {
		//checking if the ball touches the borders of the goal
		if (
			gameState.ballPosition.x - this.ballRadius <=
				this.p1GateX + this.ballRadius * 2 &&
			gameState.ballPosition.y + this.ballRadius >= this.gateY &&
			gameState.ballPosition.y - this.ballRadius <= this.gateY + this.gateHeight
		) {
			gameState.result = [gameState.result[0], gameState.result[1] + 1];
			this.resetBall(gameState);
			this.randomInitialMove(gameState);
		}

		if (
			gameState.ballPosition.x + this.ballRadius >= this.p2GateX &&
			gameState.ballPosition.y + this.ballRadius >= this.gateY &&
			gameState.ballPosition.y - this.ballRadius <= this.gateY + this.gateHeight
		) {
			gameState.result = [gameState.result[0] + 1, gameState.result[1]];
			this.resetBall(gameState);
			this.randomInitialMove(gameState);
		}
	}

	checkPlayers(gameState: State) {
		//checking if the ball is touching the players, and if so, calculating the angle of rebound
		if (
			gameState.ballPosition.x - this.ballRadius <= this.player1x &&
			gameState.ballPosition.y + this.ballRadius >= gameState.p1 &&
			gameState.ballPosition.y - this.ballRadius <= gameState.p1 + this.pHeight
		) {
			gameState.move = {
				stepX: -gameState.move.stepX,
				stepY: gameState.move.stepY,
			};
		}

		if (
			gameState.ballPosition.x - this.ballRadius >= this.player2x &&
			gameState.ballPosition.y + this.ballRadius >= gameState.p2 &&
			gameState.ballPosition.y - this.ballRadius <= gameState.p2 + this.pHeight
		) {
			gameState.move = {
				stepX: -gameState.move.stepX,
				stepY: gameState.move.stepY,
			};
		}
	}

	checkBallBoundaries(gameState: State) {
		//checking if the ball is touching the boundaries, and if so, calculating the angle of rebound
		if (
			gameState.ballPosition.y + this.ballRadius + gameState.move.stepY >=
				this.bottomBoundary ||
			gameState.ballPosition.y - this.ballRadius + gameState.move.stepY <=
				this.topBoundary
		) {
			gameState.move = {
				stepX: gameState.move.stepX,
				stepY: -gameState.move.stepY,
			};
		}

		if (
			gameState.ballPosition.x - this.ballRadius + gameState.move.stepX <=
				this.leftBoundary ||
			gameState.ballPosition.x + this.ballRadius + gameState.move.stepX >=
				this.rightBoundary
		) {
			gameState.move = {
				stepX: -gameState.move.stepX,
				stepY: gameState.move.stepY,
			};
		}
	}

	check(gameRoom: GameRoom) {
		this.checkPlayers(gameRoom.gameState);
		this.checkGoals(gameRoom.gameState);
		this.checkBallBoundaries(gameRoom.gameState);
		this.checkGameOver(gameRoom);
	}

	tick(gameRoom: GameRoom) {
		if (gameRoom.gameState.live === true) {
			gameRoom.gameState.ballPosition = {
				x: gameRoom.gameState.ballPosition.x + gameRoom.gameState.move.stepX,
				y: gameRoom.gameState.ballPosition.y + gameRoom.gameState.move.stepY,
			};
		}
		this.check(gameRoom);
	}

	checkPlayerBoundaries(
		player: number, //checking the boundaries of players for going beyond the field
		gameState: State
	) {
		if (player === 1) {
			if (gameState.p1 + this.pHeight >= this.playerMaxY) return 1;
			if (gameState.p1 <= this.playerMinY) {
				return 2;
			}
		} else if (player === 2) {
			if (gameState.p2 + this.pHeight >= this.playerMaxY) return 3;
			if (gameState.p2 <= this.playerMinY) return 4;
		}

		return 0;
	}

	resetPlayer(
		code: number, //return of players to the field, in case of exit
		gameState: State
	) {
		if (code === 1) {
			gameState.p1 = this.playerMaxY - this.pHeight;
		}
		if (code === 2) {
			gameState.p1 = this.playerMinY;
		}
		if (code === 3) {
			gameState.p2 = this.playerMaxY - this.pHeight;
		}
		if (code === 4) {
			gameState.p2 = this.playerMinY;
		}
	}

	resetBall(gameState: State) {
		gameState.ballPosition = this.placeBall();
	}

	restart(gameState: State) {
		this.resetBall(gameState);
		this.randomInitialMove(gameState);
	}

	pause(gameState: State) {
		gameState.live = !gameState.live;
		gameState.isPaused = !gameState.isPaused;
	}

	async checkGameOver(gameRoom: GameRoom) {
		if (
			(gameRoom.gameState.result[0] === WINNING_SCORE ||
				gameRoom.gameState.result[1] === WINNING_SCORE) &&
			!gameRoom.gameState.isPaused
		) {
			this.pause(gameRoom.gameState);
			this.logger.log("[Check Game Over]: A player won!");

			await this.stopGame(gameRoom, true);
		}
	}

	@SubscribeMessage("up")
	async onUp(@ConnectedSocket() socket: Socket, @MessageBody() token: string) {
		const user: UserEntity = await this.getUserOrFail(token, socket);

		const gameRoom: GameRoom = this.getCurrentPlayRoom(user.id);
		if (gameRoom === null) {
			this.logger.warn("[On Up]: GameRoom not found");
			return;
		}

		let playerIndex = 1;
		if (gameRoom.player1.userID === user.id) {
			gameRoom.gameState.p1 -= this.step;
		} else if (gameRoom.player2.userID === user.id) {
			playerIndex = 2;
			gameRoom.gameState.p2 -= this.step;
		}

		if (this.checkPlayerBoundaries(playerIndex, gameRoom.gameState)) {
			this.resetPlayer(
				this.checkPlayerBoundaries(playerIndex, gameRoom.gameState),
				gameRoom.gameState
			);
		}
	}

	@SubscribeMessage("down")
	async onDown(
		@ConnectedSocket() socket: Socket,
		@MessageBody() token: string
	) {
		const user: UserEntity = await this.getUserOrFail(token, socket);
		const gameRoom: GameRoom = this.getCurrentPlayRoom(user.id);
		if (gameRoom === null) {
			this.logger.warn("[On Down]: GameRoom not found");
			return;
		}

		let playerIndex = 1;
		if (gameRoom.player1.userID === user.id) {
			gameRoom.gameState.p1 += this.step;
		} else if (gameRoom.player2.userID === user.id) {
			playerIndex = 2;
			gameRoom.gameState.p2 += this.step;
		}
		if (this.checkPlayerBoundaries(playerIndex, gameRoom.gameState)) {
			this.resetPlayer(
				this.checkPlayerBoundaries(playerIndex, gameRoom.gameState),
				gameRoom.gameState
			);
		}
	}

	@SubscribeMessage("get games")
	async onGetGames(
		@ConnectedSocket() socket: Socket,
		@MessageBody() token: string
	) {
		const userID: number = await this.socketGateway.checkIdentity(
			token,
			socket
		);
		const user = await this.usersService.fetchUserByID(userID);
		if (!user) {
			throw new UserNotFoundError();
		}
		const gameInfos: GameInfo[] = this.gameRooms.map(this.gameToGameInfo);
		socket.emit("get games", gameInfos);
	}

	private async getValidInvite(
		inviteID: number,
		userID: number
	): Promise<sendInviteDto> {
		if (!inviteID) {
			return null;
		}
		let invitation: sendInviteDto;
		try {
			invitation = await this.invitesService.fetchInviteByID(inviteID);
			if (!invitation) {
				return null;
			}
			if (invitation.invitedID !== userID && invitation.senderID !== userID) {
				return null;
			}
			await this.permissionChecks.checkUserInviteHasNotExpired(invitation);
		} catch (e) {
			return null;
		}
		return invitation;
	}

	@SubscribeMessage("leave game")
	async onLeaveGame(
		@ConnectedSocket() socket: Socket,
		@MessageBody() token: string
	) {
		const user: UserEntity = await this.getUserOrFail(token, socket);
		const gameRoom: GameRoom = this.getCurrentPlayRoom(user.id);

		await this.stopGame(gameRoom, false, user.id);
	}

	gameToGameInfo(game: GameRoom): GameInfo {
		if (!game) return null;
		const gameInfo: GameInfo = {
			player1: {
				userID: game.player1.userID,
				username: game.player1.username,
			},
			player2: {
				userID: game.player2.userID,
				username: game.player2.username,
			},
			socketRoomID: game.socketRoomID,
		};
		return gameInfo;
	}

	@SubscribeMessage("stop watching")
	async onStopWatch(
		@ConnectedSocket() socket: Socket,
		@MessageBody() token: string
	) {
		const user: UserEntity = await this.getUserOrFail(token, socket);
		await this.stopWatchingAllGames(user.id, socket);
	}

	private async getUserOrFail(
		token: string,
		socket: Socket
	): Promise<UserEntity> {
		const userID: number = await this.socketGateway.checkIdentity(
			token,
			socket
		);
		const user = await this.usersService.fetchUserByID(userID);
		if (!user) {
			// TODO: maybe deal with that ?
			throw new UserNotFoundError();
		}
		return user;
	}

	private leaveWaitlist(userID: number): void {
		this.waitList = this.waitList.filter((player: Player) => {
			return player.userID !== userID;
		});
	}

	private async expireOutdatedInvites(
		userID: number,
		keepInviteID: number = null
	) {
		const invites: sendInviteDto[] =
			await this.invitesService.fetchGameInvitesBySenderID(userID);
		await Promise.all(
			invites.map(async (invite: sendInviteDto) => {
				if (invite.id !== keepInviteID) {
					await this.invitesService.deleteInviteByID(invite.id);
				}
			})
		);
	}

	private async cleanupUserGames(
		userID: number,
		socket: Socket,
		inviteID: number = null
	) {
		this.logger.log("[Cleanup]: Cleaning up player games");
		const currentPlayRoom: GameRoom = this.getCurrentPlayRoom(userID);
		if (currentPlayRoom) {
			throw new Error(
				"User is in playroom and hasn't been reconnected (cleanup)"
			);
		}
		await this.stopWatchingAllGames(userID, socket);
		this.leaveWaitlist(userID);
		await this.expireOutdatedInvites(userID, inviteID);
	}

	@SubscribeMessage("reconnect")
	async onRejoinGame(
		@ConnectedSocket() socket: Socket,
		@MessageBody() token: string
	) {
		const user: UserEntity = await this.getUserOrFail(token, socket);
		const currentGameRoom: GameRoom = await this.reconnect(socket, user.id);

		let data: Response = {
			success: Boolean(currentGameRoom),
			gameInfo: this.gameToGameInfo(currentGameRoom),
		};

		socket.emit("reconnect", data);
	}

	@SubscribeMessage("watch")
	async onWatch(
		@ConnectedSocket() socket: Socket,
		@MessageBody() body: { token: string; gameID: string }
	) {
		const user: UserEntity = await this.getUserOrFail(body.token, socket);

		await this.cleanupUserGames(user.id, socket);

		const targetGameRoom: GameRoom = this.getRoomByID(body.gameID);

		let data: Response = {
			success: Boolean(targetGameRoom),
			gameInfo: this.gameToGameInfo(targetGameRoom),
		};

		if (data.success) {
			const watcher: Watcher = {
				userID: user.id,
				username: user.username,
				socket: socket,
			};
			await this.addWatcherToGameRoom(watcher, targetGameRoom);
		}
		socket.emit("watch", data);
	}

	private convertInviteIDFromString(inviteID: string): number {
		const convertedInviteID = Number(inviteID);
		if (
			isNaN(convertedInviteID) ||
			!isInt(convertedInviteID) ||
			!isPositive(convertedInviteID)
		)
			return null;
		return convertedInviteID;
	}

	@SubscribeMessage("wait invite")
	async onWaitInvite(
		@ConnectedSocket() socket: Socket,
		@MessageBody() body: { token: string; inviteID: string }
	) {
		const user: UserEntity = await this.getUserOrFail(body.token, socket);

		const inviteID: number = this.convertInviteIDFromString(body.inviteID);
		await this.cleanupUserGames(user.id, socket, inviteID);
		if (!inviteID) {
			socket.emit("wait invite", { success: false });
			return;
		}
		const invite: sendInviteDto = await this.getValidInvite(inviteID, user.id);
		if (!invite) {
			socket.emit("wait invite", { success: false });
			return;
		}
		const isAcceptingInvite: boolean = user.id === invite.invitedID;

		const player: Player = {
			userID: user.id,
			username: user.username,
			socket: socket,
			inviteID: inviteID,
		};
		const myGameRoom: GameRoom = await this.getRoomOrWait(
			player,
			isAcceptingInvite
		);
		if (!myGameRoom) {
			if (isAcceptingInvite) {
				await this.invitesService.deleteInviteByID(inviteID);
				socket.emit("wait invite", { success: false });
				return;
			}
			socket.emit("wait invite", { success: true });
		} else {
			this.startGame(myGameRoom);
		}
	}

	@SubscribeMessage("enter lobby")
	async onEnterLobby(
		@ConnectedSocket() socket: Socket,
		@MessageBody() body: { token: string; inviteID: string }
	) {
		const user: UserEntity = await this.getUserOrFail(body.token, socket);

		const player: Player = {
			userID: user.id,
			username: user.username,
			socket: socket,
		};
		const myGameRoom: GameRoom = await this.getRoomOrWait(player);
		if (myGameRoom) {
			this.startGame(myGameRoom);
		}
	}

	@SubscribeMessage("leave lobby")
	async onLeaveLobby(
		@ConnectedSocket() socket: Socket,
		@MessageBody() token: string
	) {
		const user: UserEntity = await this.getUserOrFail(token, socket);

		const players: Player[] = this.waitList.filter((player: Player) => {
			return player.userID === user.id;
		});
		await Promise.all(
			players.map(async (player: Player) => {
				if (player.inviteID) {
					await this.invitesService.deleteInviteByID(player.inviteID);
				}
			})
		);
		this.leaveWaitlist(user.id);
	}

	@SubscribeMessage("is in game")
	async onIsActive(
		@ConnectedSocket() socket: Socket,
		@MessageBody() token: string
	) {
		const user: UserEntity = await this.getUserOrFail(token, socket);

		const isInGame: boolean = Boolean(this.getCurrentPlayRoom(user.id));
		socket.emit("is in game", isInGame);
	}
}
