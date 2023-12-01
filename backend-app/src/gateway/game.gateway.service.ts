import { Inject, forwardRef, Logger, Injectable } from "@nestjs/common";
import { GamesService } from "src/games/games.service";
import { Socket } from "socket.io";
import { createGameParams } from "src/games/utils/types";
import { UserEntity, userStatus } from "src/users/entities/user.entity";
import { UsersService } from "src/users/users.service";
import { InvitesService } from "src/invites/invites.service";
import { sendInviteDto } from "src/invites/dtos/sendInvite.dto";
import { PermissionChecks } from "./permission-checks";
import { GameGateway } from "./game.gateway";
import {
	GameLogicService,
	GAME_SPEED,
	State,
	WINNING_SCORE,
} from "./game-logic.service";

export type Player = {
	userID: number;
	username: string;
	socket?: Socket;
	inviteID?: number;
};

export type Watcher = Player;

export enum Direction {
	Up,
	Down,
}

export enum LobbyStatus {
	InvalidInvite,
	StartGame,
	WaitInLobby,
}

export type GameRoom = {
	player1: Player;
	player2: Player;
	socketRoomID: string;
	gameState: State;
	interval: NodeJS.Timeout;
	watchers: Watcher[];
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

@Injectable()
export class GameGatewayService {
	constructor(
		@Inject(forwardRef(() => GamesService))
		private gameService: GamesService,
		@Inject(forwardRef(() => UsersService))
		private usersService: UsersService,
		@Inject(forwardRef(() => InvitesService))
		private invitesService: InvitesService,
		@Inject(forwardRef(() => PermissionChecks))
		private permissionChecks: PermissionChecks,
		@Inject(forwardRef(() => GameGateway))
		private gameGateway: GameGateway,
		@Inject(forwardRef(() => GameLogicService))
		private gameLogicService: GameLogicService
	) {}

	readonly logger: Logger = new Logger("Game Gateway Service");

	gameRooms: GameRoom[];
	waitList: Player[];
	gameRoomID: number;

	onModuleInit() {
		this.gameRooms = [];
		this.waitList = [];
		this.gameRoomID = 0;
	}

	private startGame(gameRoom: GameRoom) {
		this.logger.log(
			`[Start Game]: game starting (${gameRoom.player1.username} - ${gameRoom.player2.username})`
		);
		this.gameLogicService.randomInitialMove(gameRoom.gameState);

		gameRoom.interval = setInterval(() => {
			this.gameLogicService.tick(gameRoom);
			this.gameGateway.sendTick(gameRoom);
		}, GAME_SPEED);
	}

	async stopGame(
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
			await this.gameGateway.sendEndGame(gameRoom, gameDetails);
			await this.gameService.saveGame(gameDetails);
		} else {
			await this.gameGateway.sendLeaveGame(gameRoom, leavingUserID);
		}
		this.gameRooms = this.gameRooms.filter(
			(gr: GameRoom) => gr.socketRoomID !== gameRoom.socketRoomID
		);
	}

	movePlayer(userID: number, direction: Direction) {
		const gameRoom: GameRoom = this.getCurrentPlayRoom(userID);
		if (gameRoom === null) {
			this.logger.warn("[Move Player]: GameRoom not found");
			return;
		}

		let playerIndex: number = gameRoom.player1.userID === userID ? 1 : 2;

		this.gameLogicService.movePlayer(playerIndex, direction, gameRoom);
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
		await this.gameGateway.updatePlayerStatus(
			userStatus.INGAME,
			player1.userID
		);
		await this.gameGateway.updatePlayerStatus(
			userStatus.INGAME,
			player2.userID
		);
		const gameRoom: GameRoom = {
			player1: player1,
			player2: player2,
			socketRoomID: socketRoomID,
			gameState: this.gameLogicService.createGameState(),
			interval: null,
			watchers: [],
		};
		this.gameRooms.push(gameRoom);
		return gameRoom;
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

	async enterLobby(userID: number, socket: Socket): Promise<void> {
		const user: UserEntity = await this.usersService.fetchUserByID(userID);
		const player: Player = {
			userID: user.id,
			username: user.username,
			socket: socket,
		};
		const myGameRoom: GameRoom = await this.getRoomOrWait(player);
		if (myGameRoom) {
			this.gameGateway.sendStartGame(myGameRoom);
			this.startGame(myGameRoom);
		}
	}

	async leaveLobby(userID: number): Promise<void> {
		const players: Player[] = this.waitList.filter((player: Player) => {
			return player.userID === userID;
		});
		await Promise.all(
			players.map(async (player: Player) => {
				if (player.inviteID) {
					await this.invitesService.deleteInviteByID(player.inviteID);
				}
			})
		);
		this.leaveWaitlist(userID);
	}

	// WATCH GAME

	async stopWatchingAllGames(userID: number, socket: Socket): Promise<void> {
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

	async addWatcherToGameRoom(
		watcher: Watcher,
		gameRoom: GameRoom
	): Promise<void> {
		await watcher.socket.join(gameRoom.socketRoomID);
		delete watcher.socket;
		gameRoom.watchers.push(watcher);
	}

	// GETTERS

	getRoomByID(gameID: string): GameRoom {
		return this.gameRooms.find((gameRoom: GameRoom) => {
			return gameRoom.socketRoomID === gameID;
		});
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

	getWatchingRooms(userID: number) {
		return this.gameRooms.filter((gameRoom: GameRoom) => {
			return gameRoom.watchers.some((watcher: Watcher) => {
				return watcher.userID === userID;
			});
		});
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

	// INVITES

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

	async waitInvite(
		userID: number,
		inviteID: number,
		socket: Socket
	): Promise<LobbyStatus> {
		const user: UserEntity = await this.usersService.fetchUserByID(userID);
		if (!inviteID) {
			return LobbyStatus.InvalidInvite;
		}
		const invite: sendInviteDto = await this.permissionChecks.getValidInvite(
			inviteID,
			userID
		);
		if (!invite) {
			return LobbyStatus.InvalidInvite;
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
				return LobbyStatus.InvalidInvite;
			}
			return LobbyStatus.WaitInLobby;
		} else {
			this.gameGateway.sendStartGame(myGameRoom);
			this.startGame(myGameRoom);
		}
	}

	// CLEANUP

	private leaveWaitlist(userID: number): void {
		this.waitList = this.waitList.filter((player: Player) => {
			return player.userID !== userID;
		});
	}
	async cleanupUserGames(
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
}
