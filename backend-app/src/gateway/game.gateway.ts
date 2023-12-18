import { OnModuleInit, Inject, forwardRef, Logger } from "@nestjs/common";
import {
	ConnectedSocket,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { Server } from "socket.io";
import { Socket } from "socket.io";
import { MessageBody } from "@nestjs/websockets";
import { createGameParams } from "src/games/utils/types";
import { UserEntity, userStatus } from "src/users/entities/user.entity";
import { UsersService } from "src/users/users.service";
import { UserNotFoundError } from "src/exceptions/not-found.interceptor";
import { SocketGateway } from "./socket.gateway";
import { PermissionChecks } from "./permission-checks";
import {
	Direction,
	GameGatewayService,
	GameInfo,
	GameRoom,
	LobbyStatus,
	Watcher,
} from "./game.gateway.service";

export type Outcome = {
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
		@Inject(forwardRef(() => UsersService))
		private usersService: UsersService,
		@Inject(forwardRef(() => PermissionChecks))
		private permissionChecks: PermissionChecks,
		@Inject(forwardRef(() => SocketGateway))
		private socketGateway: SocketGateway,
		@Inject(forwardRef(() => GameGatewayService))
		private gameGatewayService: GameGatewayService
	) {}
	@WebSocketServer()
	server: Server;

	onModuleInit() {}

	private readonly logger: Logger = new Logger("Game Gateway");

	sendTick(gameRoom: GameRoom) {
		this.server.to(gameRoom.socketRoomID).emit("tick", gameRoom);
	}

	async sendLeaveGame(gameRoom: GameRoom, leavingUserID: number) {
		this.server.to(gameRoom.socketRoomID).emit("leave game", leavingUserID);
		this.server.in(gameRoom.socketRoomID).socketsLeave(gameRoom.socketRoomID);
		await this.updatePlayerStatus(userStatus.ONLINE, gameRoom.player1.userID);
		await this.updatePlayerStatus(userStatus.ONLINE, gameRoom.player2.userID);
	}

	async sendEndGame(gameRoom: GameRoom, gameDetails: createGameParams) {
		this.server.to(gameRoom.socketRoomID).emit("end game", gameDetails);
		this.server.in(gameRoom.socketRoomID).socketsLeave(gameRoom.socketRoomID);
		await this.updatePlayerStatus(userStatus.ONLINE, gameRoom.player1.userID);
		await this.updatePlayerStatus(userStatus.ONLINE, gameRoom.player2.userID);
	}

	async sendStartGame(gameRoom: GameRoom) {
		this.server
			.to(gameRoom.socketRoomID)
			.emit("start game", this.gameGatewayService.gameToGameInfo(gameRoom));
	}

	async updatePlayerStatus(userStatus: userStatus, userID: number) {
		await this.usersService.updateUserByID(userID, { status: userStatus });
		this.server.emit("status change", {
			userID: userID,
			userStatus: userStatus,
		});
	}

	private async reconnect(socket: Socket, userID: number): Promise<GameRoom> {
		const myGameRoom: GameRoom =
			this.gameGatewayService.getCurrentPlayRoom(userID);
		if (!myGameRoom) {
			return null;
		}
		await this.updatePlayerStatus(userStatus.INGAME, userID);
		await socket.join(myGameRoom.socketRoomID);
		this.logger.log(
			`[Reconnect]: setting up user ${userID} to join game room ${myGameRoom.socketRoomID}`
		);
		return myGameRoom;
	}

	@SubscribeMessage("up")
	async onUp(@ConnectedSocket() socket: Socket, @MessageBody() token: string) {
		try {
			const tokenUserID = await this.socketGateway.checkIdentity(token, socket);

			this.gameGatewayService.movePlayer(tokenUserID, Direction.Up);
		} catch (e) {
			this.logger.warn(`[On Up]: ${e.message}`);
		}
	}

	@SubscribeMessage("down")
	async onDown(
		@ConnectedSocket() socket: Socket,
		@MessageBody() token: string
	) {
		try {
			const tokenUserID = await this.socketGateway.checkIdentity(token, socket);

			this.gameGatewayService.movePlayer(tokenUserID, Direction.Down);
		} catch (e) {
			this.logger.warn(`[On Down]: ${e.message}`);
		}
	}

	@SubscribeMessage("get games")
	async onGetGames(
		@ConnectedSocket() socket: Socket,
		@MessageBody() token: string
	) {
		try {
			const userID: number = await this.socketGateway.checkIdentity(
				token,
				socket
			);
			const user = await this.usersService.fetchUserByID(userID);
			if (!user) {
				throw new UserNotFoundError();
			}
			const gameInfos: GameInfo[] = this.gameGatewayService.gameRooms.map(
				this.gameGatewayService.gameToGameInfo
			);
			socket.emit("get games", gameInfos);
		} catch (e) {
			this.logger.warn(`[Get Games]: ${e.message}`);
		}
	}

	@SubscribeMessage("leave game")
	async onLeaveGame(
		@ConnectedSocket() socket: Socket,
		@MessageBody() token: string
	) {
		try {
			const tokenUserID = await this.socketGateway.checkIdentity(token, socket);
			const gameRoom: GameRoom =
				this.gameGatewayService.getCurrentPlayRoom(tokenUserID);

			await this.gameGatewayService.stopGame(gameRoom, false, tokenUserID);
		} catch (e) {
			this.logger.warn(`[On Leave Game]: ${e.message}`);
		}
	}

	@SubscribeMessage("stop watching")
	async onStopWatch(
		@ConnectedSocket() socket: Socket,
		@MessageBody() token: string
	) {
		try {
			const tokenUserID = await this.socketGateway.checkIdentity(token, socket);
			await this.gameGatewayService.stopWatchingAllGames(tokenUserID, socket);
		} catch (e) {
			this.logger.warn(`[Stop Watching]: ${e.message}`);
		}
	}

	@SubscribeMessage("reconnect")
	async onRejoinGame(
		@ConnectedSocket() socket: Socket,
		@MessageBody() token: string
	) {
		try {
			const tokenUserID = await this.socketGateway.checkIdentity(token, socket);
			const currentGameRoom: GameRoom = await this.reconnect(
				socket,
				tokenUserID
			);

			let data: Outcome = {
				success: Boolean(currentGameRoom),
				gameInfo: this.gameGatewayService.gameToGameInfo(currentGameRoom),
			};

			socket.emit("reconnect", data);
		} catch (e) {
			this.logger.warn(`[Reconnect]: ${e.message}`);
		}
	}

	@SubscribeMessage("watch")
	async onWatch(
		@ConnectedSocket() socket: Socket,
		@MessageBody() body: { token: string; gameID: string }
	) {
		try {
			const tokenUserID = await this.socketGateway.checkIdentity(
				body.token,
				socket
			);
			const user: UserEntity = await this.usersService.fetchUserByID(
				tokenUserID
			);

			await this.gameGatewayService.cleanupUserGames(tokenUserID, socket);

			const targetGameRoom: GameRoom = this.gameGatewayService.getRoomByID(
				body.gameID
			);

			let data: Outcome = {
				success: Boolean(targetGameRoom),
				gameInfo: this.gameGatewayService.gameToGameInfo(targetGameRoom),
			};

			if (data.success) {
				const watcher: Watcher = {
					userID: user.id,
					username: user.username,
					socket: socket,
				};
				await this.gameGatewayService.addWatcherToGameRoom(
					watcher,
					targetGameRoom
				);
			}
			socket.emit("watch", data);
		} catch (e) {
			this.logger.warn(`[Watch]: ${e.message}`);
		}
	}

	@SubscribeMessage("wait invite")
	async onWaitInvite(
		@ConnectedSocket() socket: Socket,
		@MessageBody() body: { token: string; inviteID: string }
	) {
		try {
			const tokenUserID = await this.socketGateway.checkIdentity(
				body.token,
				socket
			);

			const inviteID: number = this.permissionChecks.convertInviteIDFromString(
				body.inviteID
			);
			await this.gameGatewayService.cleanupUserGames(
				tokenUserID,
				socket,
				inviteID
			);
			const outcome: LobbyStatus = await this.gameGatewayService.waitInvite(
				tokenUserID,
				inviteID,
				socket
			);
			if (outcome === LobbyStatus.InvalidInvite) {
				socket.emit("wait invite", { success: false });
			} else if (outcome === LobbyStatus.WaitInLobby) {
				socket.emit("wait invite", { success: true });
			}
			// else the game gateway service has already called start game
		} catch (e) {
			this.logger.warn(`[Wait Invite]: ${e.message}`);
		}
	}

	@SubscribeMessage("enter lobby")
	async onEnterLobby(
		@ConnectedSocket() socket: Socket,
		@MessageBody() body: { token: string; inviteID: string }
	) {
		try {
			const tokenUserID = await this.socketGateway.checkIdentity(
				body.token,
				socket
			);
			await this.gameGatewayService.enterLobby(tokenUserID, socket);
		} catch (e) {
			this.logger.warn(`[Enter Lobby]: ${e.message}`);
		}
	}

	@SubscribeMessage("leave lobby")
	async onLeaveLobby(
		@ConnectedSocket() socket: Socket,
		@MessageBody() token: string
	) {
		try {
			const tokenUserID = await this.socketGateway.checkIdentity(token, socket);
			await this.gameGatewayService.leaveLobby(tokenUserID);
		} catch (e) {
			this.logger.warn(`[Leave Lobby]: ${e.message}`);
		}
	}

	@SubscribeMessage("is in game")
	async onIsActive(
		@ConnectedSocket() socket: Socket,
		@MessageBody() token: string
	) {
		try {
			const tokenUserID = await this.socketGateway.checkIdentity(token, socket);
			const isInGame: boolean = Boolean(
				this.gameGatewayService.getCurrentPlayRoom(tokenUserID)
			);
			socket.emit("is in game", isInGame);
		} catch (e) {
			this.logger.warn(`[Is In Game]: ${e.message}`);
		}
	}
}
