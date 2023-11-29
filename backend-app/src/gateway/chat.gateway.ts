import {
	OnModuleInit,
	Inject,
	forwardRef,
	ValidationPipe,
	UsePipes,
	UseFilters,
	Logger,
} from "@nestjs/common";
import { sendInviteDto } from "src/invites/dtos/sendInvite.dto";
import { createChatMessageParams } from "src/chat-messages/utils/types";
import {
	ConnectedSocket,
	MessageBody,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { AuthService, JwtToken } from "src/auth/auth.service";
import { ChatMessagesService } from "src/chat-messages/chat-messages.service";
import { ChatParticipantsService } from "src/chat-participants/chat-participants.service";
import { ChatParticipantEntity } from "src/chat-participants/entities/chat-participant.entity";
import { UserEntity, userStatus } from "src/users/entities/user.entity";
import { ChatsService } from "src/chats/chats.service";
import { BlockedUsersService } from "src/blocked-users/blockedUsers.service";
import {
	ChatJoinError,
	ChatPermissionError,
	InviteCreationError,
} from "src/exceptions/bad-request.interceptor";
import { InviteEntity, inviteType } from "src/invites/entities/Invite.entity";
import { InvitesService } from "src/invites/invites.service";
import { UsersService } from "src/users/users.service";
import { FriendsService } from "src/friends/friends.service";
import { UserChatInfo } from "src/chat-participants/utils/types";
import { ReceivedInfoDto } from "./dtos/chatGateway.dto";
import { ChatEntity } from "src/chats/entities/chat.entity";
import { PasswordService } from "src/password/password.service";
import { WebsocketExceptionsFilter } from "src/exceptions/websocket-exception.filter";
import { BadRequestException } from "@nestjs/common";

type UserTargetChat = {
	userID: number;
	targetID: number;
	chatRoomID?: number;
	inviteType?: inviteType;
};

enum RoomType {
	User,
	Chat,
}

@WebSocketGateway({
	cors: {
		origin: [
			"http://localhost:3000",
			"http://localhost",
			process.env.FT_TRANSCENDANCE_DOMAIN,
		],
	},
})
@UseFilters(WebsocketExceptionsFilter)
@UsePipes(new ValidationPipe({ whitelist: true }))
export class ChatGateway implements OnModuleInit {
	constructor(
		@Inject(forwardRef(() => ChatMessagesService))
		private chatMessagesService: ChatMessagesService,
		@Inject(forwardRef(() => ChatsService))
		private chatsService: ChatsService,
		@Inject(forwardRef(() => ChatParticipantsService))
		private chatParticipantsService: ChatParticipantsService,
		@Inject(forwardRef(() => UsersService))
		private userService: UsersService,
		@Inject(forwardRef(() => InvitesService))
		private inviteService: InvitesService,
		@Inject(forwardRef(() => AuthService))
		private authService: AuthService,
		@Inject(forwardRef(() => PasswordService))
		private passwordService: PasswordService,
		@Inject(forwardRef(() => FriendsService))
		private friendService: FriendsService,
		@Inject(forwardRef(() => BlockedUsersService))
		private blockedUserService: BlockedUsersService
	) {}
	@WebSocketServer()
	server: Server;

	private readonly logger: Logger = new Logger("Chat Gateway");

	onModuleInit(): void {
		this.server.on("connection", async (socket) => {
			try {
				this.logger.debug("[Connection event]: Received connection event");
				const token = socket.handshake.headers.authorization.split(" ")[1];
				const tokenInfo: JwtToken = await this.authService.validateToken(token);
				if (tokenInfo === null) return;
				const user = await this.userService.fetchUserByID(tokenInfo.userID);

				this.logger.log(
					`[Connection event]: A user connected: ${tokenInfo.username} - ${tokenInfo.userID} (${socket.id})`
				);
				socket.broadcast.emit("connection event"); // TODO: probably remove
				socket.on("disconnect", () => {
					this.logger.log(
						`[Disconnection event]: A user disconnected: ${tokenInfo.username} - ${tokenInfo.userID} (${socket.id})`
					);
					this.onLogout(socket, token);
					// socket.broadcast.emit('disconnection event');
				});

				if (tokenInfo && user) {
					await this.joinSocketRooms(socket, user.id);
				}
			} catch (e) {
				this.logger.error(
					`[Connection event]: unauthorized connection: ${e.message}`
				);
				socket.emit("logout");
				return;
			}
		});
	}

	// -------------------- EVENTS
	// TODO: GET TOKEN FROM SOCKET NOT FROM PASSED TOKEN!!!
	async checkIdentity(token: string, socket: Socket): Promise<number> {
		try {
			const socketToken = socket.handshake.headers.authorization.split(" ")[1];
			if (token !== socketToken) {
				// TODO: why is socketToken sometimes undefined ? Investigate.
				this.logger.warn(
					"[Check Identity]: Socket token and token DON'T MATCH!"
				);
			}
			if (socketToken === "undefined") {
				this.logger.warn("[Check Identity]: Socket token is undefined");
				// throw new ChatPermissionError('socket token is undefined');
			}
			const tokenInfo: JwtToken = await this.authService.validateToken(token);
			if (tokenInfo === null) {
				throw new ChatPermissionError("no token to identify user!");
			}
			return tokenInfo.userID;
		} catch (e) {
			this.logger.error(`[Check Identity]: unauthorized: ${e.message}`);
			throw new ChatPermissionError("no token to identify user!");
			return;
		}
	}

	private async joinSocketRooms(socket: Socket, userID: number) {
		// Join channel named by the id of the user
		socket.data.userID = userID;
		await socket.join(this.getSocketRoomIdentifier(userID, RoomType.User));
		// Join all the channels the user is part of
		const chats = await this.userService.fetchUserChatsByUserID(userID);
		chats.map(async (chatRoom: ChatEntity) => {
			await socket.join(
				this.getSocketRoomIdentifier(chatRoom.id, RoomType.Chat)
			); // Name of the socket room is the string id of the channel
		});
	}

	@SubscribeMessage("logout")
	async onLogout(
		@ConnectedSocket() socket: Socket,
		@MessageBody() token: string
	): Promise<void> {
		try {
			const userID = await this.checkIdentity(token, socket);
			socket.data.userID = userID;

			await this.authService.logout(userID);
			socket.rooms.forEach(async (room: string) => {
				if (room !== socket.id) await socket.leave(room);
			});

			const username = (await this.userService.fetchUserByID(userID)).username;
			this.logger.log(
				`[Logout event]: A user logged out: ${username} - ${userID} (${socket.id})`
			);
			this.server.emit("status change", {
				userID: userID,
				userStatus: userStatus.OFFLINE,
			});
		} catch (e) {
			this.logger.error(`[Logout event]: ${e.message}`);
		}
	}

	@SubscribeMessage("login")
	async onLogin(
		@ConnectedSocket() socket: Socket,
		@MessageBody() token: string
	): Promise<void> {
		try {
			const userID = await this.checkIdentity(token, socket);
			socket.data.userID = userID;

			await this.userService.updateUserByID(userID, {
				status: userStatus.ONLINE,
			});
			const username = (await this.userService.fetchUserByID(userID)).username;
			this.logger.log(
				`[Login event]: A user logged in: ${username} - ${userID} (${socket.id})`
			);
			this.server.emit("status change", {
				userID: userID,
				userStatus: userStatus.ONLINE,
			});
		} catch (e) {
			this.logger.error(`[Login event]: ${e.message}`);
		}
	}

	@SubscribeMessage("add chat")
	async onAddChat(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.checkIdentity(info.token, socket);
			info.chatInfo.ownerID = info.userID;
			const owner = await this.userService.fetchUserByID(info.userID);
			info.username = owner.username;
			const chat = await this.chatsService.createChat(info.chatInfo);
			info.chatRoomID = chat.id;
			info.chatInfo.hasPassword =
				await this.chatsService.fetchChatHasPasswordByID(info.chatRoomID);

			if (socket.data.userID === info.userID) {
				// Making the owner join the socket room
				await socket.join(
					this.getSocketRoomIdentifier(info.chatRoomID, RoomType.Chat)
				);
			}
			info.token = "";
			this.server.emit("add chat", info);
		} catch (e) {
			this.logger.error(`[Add Chat]: ${e.message}`);
			this.server
				.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
				.emit("error", "Chat creation error: " + e.message);
		}
	}

	@SubscribeMessage("leave socket room")
	async onLeaveSocketRoom(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.checkIdentity(info.token, socket);
			const userParticipant =
				await this.chatParticipantsService.fetchParticipantEntityByUserChatID({
					userID: info.userID,
					chatRoomID: info.chatRoomID,
				});
			if (!userParticipant || userParticipant.isBanned) {
				await socket.leave(
					this.getSocketRoomIdentifier(info.chatRoomID, RoomType.Chat)
				);
			}
		} catch (e) {
			this.logger.error(`[Leave Socket Room]: ${e.message}`);
			this.server
				.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
				.emit("error", "Leave socket room error: " + e.message);
		}
	}

	@SubscribeMessage("join socket room")
	async onJoinSocketRoom(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.checkIdentity(info.token, socket);
			const userParticipant =
				await this.chatParticipantsService.fetchParticipantEntityByUserChatID({
					userID: info.userID,
					chatRoomID: info.chatRoomID,
				});
			if (userParticipant) {
				await socket.join(
					this.getSocketRoomIdentifier(info.chatRoomID, RoomType.Chat)
				);
			}
		} catch (e) {
			this.logger.error(`[Join Socket Room]: ${e.message}`);
			this.server
				.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
				.emit("error", "Join Socket Room error " + e.message);
		}
	}

	@SubscribeMessage("dm")
	async onDM(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.checkIdentity(info.token, socket);

			const chat = await this.chatsService.createChatDM({
				userID1: info.userID,
				userID2: info.targetID,
			});
			const user1 = await this.userService.fetchUserByID(info.userID);
			const user2 = await this.userService.fetchUserByID(info.targetID);
			info.chatRoomID = chat.id;
			info.username = user1.username;
			info.username2 = user2.username;
			info.token = "";
			this.server
				.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
				.to(this.getSocketRoomIdentifier(info.targetID, RoomType.User))
				.emit("dm", info);
		} catch (e) {
			this.logger.error(`[Add DM]: ${e.message}`);
			// this.server
			// 	.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
			// 	.emit("error", err_msg);
		}
	}

	@SubscribeMessage("delete chat")
	async onDeleteChat(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.checkIdentity(info.token, socket);
			this.deleteChatRoom({ userID: info.userID, chatRoomID: info.chatRoomID });
			info.token = "";
			this.server.emit("delete chat", info);
		} catch (e) {
			this.logger.error(`[Delete Chat]: ${e.message}`);
			this.server
				.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
				.emit("error", "Delete chat error: ", e.message);
		}
	}

	// TODO: Validate chat join by checking password if there is one.
	@SubscribeMessage("join chat")
	async onJoinChat(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		// TODO: good error message "You have been banned"
		try {
			info.userID = await this.checkIdentity(info.token, socket);
			const user = await this.userService.fetchUserByID(info.userID);
			if (info.chatInfo && info.chatInfo.password !== undefined) {
				await this.checkChatRoomPassword(
					info.chatInfo.password,
					info.chatRoomID
				);
			}
			await this.addUserToChat({
				userID: info.userID,
				chatRoomID: info.chatRoomID,
			});
			const chat = await this.chatsService.fetchChatByID(info.chatRoomID);
			info.username = user.username;
			info = {
				...info,
				chatInfo: {
					isPrivate: chat.isPrivate,
					isDirectMessage: chat.isDirectMessage,
					name: chat.name,
				},
			};

			if (socket.data.userID === info.userID) {
				// Making the participants join the socket room
				await socket.join(
					this.getSocketRoomIdentifier(info.chatRoomID, RoomType.Chat)
				);
			}
			info.token = "";
			this.server
				.to(this.getSocketRoomIdentifier(info.chatRoomID, RoomType.Chat))
				.emit("join chat", info);
		} catch (e) {
			this.logger.error(`[Join Chat]: ${e.message}`);
			this.server
				.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
				.emit("error", "Join chat error" + e.message);
		}
	}

	@SubscribeMessage("leave chat")
	async onLeaveChat(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.checkIdentity(info.token, socket);
			info.username = (
				await this.userService.fetchUserByID(info.userID)
			).username;
			await this.leaveChatRoom({
				userID: info.userID,
				chatRoomID: info.chatRoomID,
			});

			info.token = "";
			this.server
				.to(this.getSocketRoomIdentifier(info.chatRoomID, RoomType.Chat))
				.emit("leave chat", info);
			if (socket.data.userID === info.userID) {
				// Making the participant leave the socket room
				await socket.leave(
					this.getSocketRoomIdentifier(info.chatRoomID, RoomType.Chat)
				);
			}
		} catch (e) {
			this.logger.error(`[Leave Chat]: ${e.message}`);
			this.server
				.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
				.emit("error", "Leave Chat:" + e.message);
		}
	}

	@SubscribeMessage("chat message")
	async onChatMessage(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			const userID = await this.checkIdentity(info.token, socket);
			info.userID = userID;
			info.messageInfo.senderID = userID;
			info.messageInfo.chatRoomID = info.chatRoomID;
			const user = await this.userService.fetchUserByID(info.userID);
			info.username = user.username;
			await this.registerChatMessage(info.messageInfo);

			info.token = "";
			this.server
				.to(this.getSocketRoomIdentifier(info.chatRoomID, RoomType.Chat))
				.emit("chat message", info);
		} catch (e) {
			this.logger.error(`[Chat Message]: ${e.message}`);
			this.server
				.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
				.emit("error", "Chat message error: " + e.message);
		}
	}

	@SubscribeMessage("mute")
	async onMute(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.checkIdentity(info.token, socket);
			info.username = (
				await this.userService.fetchUserByID(info.targetID)
			).username;
			info.participantInfo.mutedUntil = await this.toggleMute(
				info.chatRoomID,
				info.userID,
				info.targetID,
				info.participantInfo.mutedUntil
			);
			info.token = "";
			this.server
				.to(this.getSocketRoomIdentifier(info.chatRoomID, RoomType.Chat))
				.emit("mute", info);
		} catch (e) {
			this.logger.error(`[Mute User]: ${e.message}`);
			this.server
				.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
				.emit("error", "Mute: " + e.message);
		}
	}

	@SubscribeMessage("toggle private")
	async onTogglePrivate(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.checkIdentity(info.token, socket);
			info.username = (
				await this.userService.fetchUserByID(info.userID)
			).username;
			const chat = await this.getChatRoomOrFail(info.chatRoomID);
			info = {
				...info,
				chatInfo: {
					isPrivate: await this.toggleChatPrivacy({
						userID: info.userID,
						chatRoomID: info.chatRoomID,
					}),
					name: chat.name,
					isDirectMessage: chat.isDirectMessage, // Useful ?
					hasPassword: await this.chatsService.fetchChatHasPasswordByID(
						info.chatRoomID
					),
				},
			};

			info.token = "";
			this.server.emit("toggle private", info);
		} catch (e) {
			this.logger.error(`[Toggle Private]: ${e.message}`);
			this.server
				.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
				.emit("error", "Toggle private error: " + e.message);
		}
	}

	@SubscribeMessage("invite")
	async onInvite(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.checkIdentity(info.token, socket);
			const inviteDetails: UserTargetChat = {
				inviteType: info.inviteInfo.type,
				userID: info.userID,
				targetID: info.targetID,
			};
			if (info.chatRoomID && info.inviteInfo.type === inviteType.CHAT) {
				inviteDetails.chatRoomID = info.chatRoomID;
			}
			const invite = await this.inviteUser(inviteDetails);
			info.inviteInfo = invite;
			info.inviteInfo.chatHasPassword =
				await this.chatsService.fetchChatHasPasswordByID(info.chatRoomID);
			info.token = "";
			this.server
				.to(
					this.getSocketRoomIdentifier(info.inviteInfo.invitedID, RoomType.User)
				)
				.to(
					this.getSocketRoomIdentifier(info.inviteInfo.senderID, RoomType.User)
				)
				.emit("invite", info);
		} catch (e) {
			this.logger.error(`[Invite User]: ${e.message}`);
			this.server
				.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
				.emit("error", "Invite: " + e.message);
		}
	}

	@SubscribeMessage("accept invite")
	async onAcceptInvite(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.checkIdentity(info.token, socket);
			const user = await this.userService.fetchUserByID(info.userID);
			switch (info.inviteInfo.type) {
				case inviteType.CHAT:
					info = await this.acceptChatInvite(user, info, socket);
					break;
				case inviteType.GAME:
					info = await this.acceptGameInvite(user, info);
					break;
				case inviteType.FRIEND:
					info = await this.acceptFriendInvite(user, info);
					break;
				default:
					throw new InviteCreationError("Invalid invite type");
			}
		} catch (e) {
			this.logger.error(`[Accept Invite]: ${e.message}`);
			this.server
				.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
				.emit("error", "Accept Invite: " + e.message);
		}
	}

	@SubscribeMessage("refuse invite")
	async onRefuseInvite(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.checkIdentity(info.token, socket);
			await this.refuseUserInvite(info.inviteInfo);
			info.token = "";
			this.server
				.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
				.emit("refuse invite", info);
		} catch (e) {
			this.logger.error(`[Refuse Invite]: ${e.message}`);
			this.server
				.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
				.emit("error", "Refuse Invite: " + e.message);
		}
	}

	@SubscribeMessage("operator")
	async onMakeOperator(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.checkIdentity(info.token, socket);
			const user = await this.userService.fetchUserByID(info.targetID);
			info.username = user.username;
			await this.toggleOperator({
				userID: info.userID,
				targetID: info.targetID,
				chatRoomID: info.chatRoomID,
			});
			const participant = await this.getParticipantOrFail({
				userID: info.targetID,
				chatRoomID: info.chatRoomID,
			});
			info = {
				...info,
				participantInfo: {
					isOperator: participant.isOperator,
				},
			};
			info.token = "";
			this.server
				.to(this.getSocketRoomIdentifier(info.chatRoomID, RoomType.Chat))
				.emit("operator", info);
		} catch (e) {
			this.logger.error(`[Add Operator]: ${e.message}`);
			this.server
				.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
				.emit("error", "Add operator: " + e.message);
		}
	}

	@SubscribeMessage("ban")
	async onBan(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.checkIdentity(info.token, socket);
			info.username = (
				await this.userService.fetchUserByID(info.targetID)
			).username;
			const isBanned = await this.banUser({
				userID: info.userID,
				targetID: info.targetID,
				chatRoomID: info.chatRoomID,
			});
			info = {
				...info,
				participantInfo: {
					isBanned: isBanned,
				},
			};
			info.token = "";
			this.server
				.to(this.getSocketRoomIdentifier(info.chatRoomID, RoomType.Chat))
				.emit("ban", info);
			if (info.targetID === socket.data.userID) {
				await socket.leave(
					this.getSocketRoomIdentifier(info.chatRoomID, RoomType.Chat)
				);
			}
		} catch (e) {
			this.logger.error(`[Ban User]: ${e.message}`);
			this.server
				.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
				.emit("error", "User ban error: " + e.message);
		}
	}

	@SubscribeMessage("kick")
	async onKick(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.checkIdentity(info.token, socket);
			info.username = (
				await this.userService.fetchUserByID(info.targetID)
			).username;

			await this.kickUser({
				userID: info.userID,
				targetID: info.targetID,
				chatRoomID: info.chatRoomID,
			});

			info.token = "";
			this.server
				.to(this.getSocketRoomIdentifier(info.chatRoomID, RoomType.Chat))
				.emit("kick", info);
		} catch (e) {
			this.logger.error(`[Kick User]: ${e.message}`);
			this.server
				.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
				.emit("error", "User kick error: " + e.message);
		}
	}

	@SubscribeMessage("set password")
	async onSetPassword(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.checkIdentity(info.token, socket);

			await this.setPassword(
				{
					userID: info.userID,
					chatRoomID: info.chatRoomID,
				},
				info.chatInfo.password
			);

			info.chatInfo.hasPassword =
				await this.chatsService.fetchChatHasPasswordByID(info.chatRoomID);

			info.token = "";
			info.chatInfo.password = "";
			this.server.emit("set password", info);
		} catch (e) {
			this.logger.error(`[Set Chat Password]: ${e.message}`);
			this.server
				.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
				.emit("error", "Set password error: " + e.message);
		}
	}

	// --------------------  PERMISSION CHECKS

	private async getChatRoomOrFail(chatRoomID: number): Promise<ChatEntity> {
		const chatRoom = await this.chatsService.fetchChatByID(chatRoomID);
		if (!chatRoom) {
			throw new ChatPermissionError(`Chat '${chatRoomID} does not exist.`);
		}
		return chatRoom;
	}

	private async getParticipantOrFail(
		info: UserChatInfo
	): Promise<ChatParticipantEntity> {
		await this.getChatRoomOrFail(info.chatRoomID);
		const userParticipant =
			await this.chatParticipantsService.fetchParticipantEntityByUserChatID(
				info
			);
		if (!userParticipant) {
			throw new ChatPermissionError(
				`User '${info.userID} is not in or invited to chat '${info.chatRoomID}`
			);
		}
		return userParticipant;
	}

	private async checkUserIsOwner(user: ChatParticipantEntity): Promise<void> {
		if (!user) {
			throw new ChatPermissionError(
				`Unexpected error during owner permission check: participant does not exist.`
			);
		}
		if (!user.isOwner) {
			throw new ChatPermissionError(
				`User '${user.user.username}' is not owner of chat '${user.chatRoom.name}'.`
			);
		}
	}

	private async checkUserIsNotOwner(
		user: ChatParticipantEntity
	): Promise<void> {
		if (!user) {
			throw new ChatPermissionError(
				`Unexpected error during owner permission check: participant does not exist.`
			);
		}
		if (user.isOwner) {
			throw new ChatPermissionError(
				`User '${user.user.username}' is owner of chat '${user.chatRoom.name}'.`
			);
		}
	}

	private async checkUserHasOperatorPermissions(
		user: ChatParticipantEntity
	): Promise<void> {
		if (!user) {
			throw new ChatPermissionError(
				`Unexpected error during operator permission check: participant does not exist.`
			);
		}
		if (!user.isOperator && !user.isOwner) {
			throw new ChatPermissionError(
				`User '${user.user.username}' does not have operator privileges in chat '${user.chatRoom.name}'.`
			);
		}
	}

	private async checkUserIsNotOperator(
		user: ChatParticipantEntity
	): Promise<void> {
		if (!user) {
			throw new ChatPermissionError(
				`Unexpected error during operator permission check: participant does not exist.`
			);
		}
		if (user.isOperator || user.isOwner) {
			throw new ChatPermissionError(
				`User '${user.user.username}' is operator of chat '${user.chatRoom.name}'.`
			);
		}
	}

	private async checkUserIsNotBanned(
		user: ChatParticipantEntity
	): Promise<void> {
		if (!user) {
			throw new ChatPermissionError(
				`Unexpected error during operator permission check: participant does not exist.`
			);
		}
		if (user.isBanned) {
			throw new ChatPermissionError(
				`User '${user.user.username}' is banned from chat '${user.chatRoom.name}'.`
			);
		}
	}

	private async checkUserIsNotMuted(
		user: ChatParticipantEntity
	): Promise<void> {
		if (!user) {
			throw new ChatPermissionError(
				`Unexpected error during muted check: participant does not exist.`
			);
		}
		if (user.mutedUntil > new Date().getTime()) {
			throw new ChatPermissionError(
				`User '${user.user.username}' is muted in chat '${user.chatRoom.name}'.`
			);
		}
	}

	async checkUserInviteIsNotPending(invite: InviteEntity): Promise<void> {
		if (!invite) {
			throw new ChatPermissionError(
				`Unexpected error during invite check: invite does not exist.`
			);
		}
		if (invite.expiresAt > new Date().getTime()) {
			throw new ChatPermissionError(
				`User '${invite.invitedUser.username}' invite to chat '${invite.chatRoom.name}' is pending.`
			);
		}
	}

	async checkUserInviteHasNotExpired(info: sendInviteDto): Promise<void> {
		const invite = await this.inviteService.fetchInviteByID(info.id);
		if (!invite) {
			throw new ChatPermissionError("Invite does not exist or has expired");
		}
		if (invite.expiresAt < new Date().getTime()) {
			await this.inviteService.deleteInviteByID(invite.id);
			throw new ChatPermissionError("Invite has expired.");
		}
	}

	private async checkUserHasNotAlreadyAcceptedInvite(
		user: ChatParticipantEntity
	): Promise<void> {
		if (user) {
			throw new ChatPermissionError(
				`User '${user.user.username}' has already accepted invite to chat '${user.chatRoom.name}'.`
			);
		}
	}

	private async checkChatRoomPassword(
		password: string,
		chatRoomID: number
	): Promise<void> {
		const chat = await this.getChatRoomOrFail(chatRoomID);
		const passwordOK = await this.passwordService.checkPasswordChat(
			password,
			chat
		);
		if (!passwordOK) {
			throw new ChatPermissionError(
				`Invalid password for chatroom ${chat.name}`
			);
		}
	}

	// -------------------- HANDLERS

	private async addUserToChat(info: UserChatInfo): Promise<void> {
		const chatRoom = await this.getChatRoomOrFail(info.chatRoomID);
		if (chatRoom.isPrivate === true) {
			throw new ChatJoinError(`Chat '${info.chatRoomID}' is private.`);
		}
		const participant =
			await this.chatParticipantsService.fetchParticipantEntityByUserChatID(
				info
			);
		if (participant) {
			if (participant.isBanned) {
				throw new ChatJoinError(
					`User '${info.userID}' is banned from '${info.chatRoomID}'.`
				);
			}
			throw new ChatJoinError(
				`User '${info.userID}' is already in chat '${info.chatRoomID}'.`
			);
		}
		if (participant && participant.isBanned) {
			throw new ChatJoinError(
				`User '${info.userID}' is banned from chat '${info.chatRoomID}'.`
			);
		}
		await this.chatsService.addParticipantToChatByUserChatID(info);
	}

	private async registerChatMessage(
		chatMessageDetails: createChatMessageParams
	): Promise<void> {
		const user = await this.getParticipantOrFail({
			userID: chatMessageDetails.senderID,
			chatRoomID: chatMessageDetails.chatRoomID,
		});

		await this.checkUserIsNotMuted(user);
		await this.checkUserIsNotBanned(user);

		await this.chatMessagesService.createMessage(chatMessageDetails);
	}

	private async toggleMute(
		chatRoomID: number,
		userID: number,
		targetUserID: number,
		minutes: number
	): Promise<number> {
		const user = await this.getParticipantOrFail({
			userID: userID,
			chatRoomID: chatRoomID,
		});
		const target = await this.getParticipantOrFail({
			userID: targetUserID,
			chatRoomID: chatRoomID,
		});

		await this.checkUserHasOperatorPermissions(user);
		await this.checkUserIsNotOwner(target);
		await this.checkUserIsNotBanned(target);

		if (target.isOperator && !target.isOwner) {
			await this.checkUserIsOwner(user);
		}

		let newMutedTimestamp = 0;
		if (user.mutedUntil > new Date().getTime()) {
			newMutedTimestamp = new Date().getTime();
		} else {
			newMutedTimestamp = new Date(
				Date.now() + minutes * (60 * 1000)
			).getTime();
		}
		await this.chatParticipantsService.updateParticipantByID(target.id, {
			mutedUntil: newMutedTimestamp,
		});
		return newMutedTimestamp;
	}

	private async toggleOperator(info: UserTargetChat): Promise<void> {
		const user = await this.getParticipantOrFail({
			chatRoomID: info.chatRoomID,
			userID: info.userID,
		});
		const target = await this.getParticipantOrFail({
			chatRoomID: info.chatRoomID,
			userID: info.targetID,
		});

		await this.checkUserIsOwner(user);
		await this.checkUserIsNotOwner(target);
		await this.checkUserIsNotBanned(target);

		await this.chatParticipantsService.updateParticipantByID(target.id, {
			isOperator: !target.isOperator,
		});
	}

	private async banUser(info: UserTargetChat): Promise<boolean> {
		const user = await this.getParticipantOrFail({
			chatRoomID: info.chatRoomID,
			userID: info.userID,
		});
		const target = await this.getParticipantOrFail({
			chatRoomID: info.chatRoomID,
			userID: info.targetID,
		});

		await this.checkUserHasOperatorPermissions(user);
		await this.checkUserIsNotOwner(target);

		if (target.isBanned) {
			// Unban
			await this.chatParticipantsService.deleteParticipantByID(target.id);
			return false;
		} else {
			// Ban
			await this.chatParticipantsService.updateParticipantByID(target.id, {
				isBanned: true,
			});
			return true;
		}
	}

	private async kickUser(info: UserTargetChat): Promise<void> {
		const user = await this.getParticipantOrFail({
			chatRoomID: info.chatRoomID,
			userID: info.userID,
		});
		const target = await this.getParticipantOrFail({
			chatRoomID: info.chatRoomID,
			userID: info.targetID,
		});

		await this.checkUserHasOperatorPermissions(user);
		await this.checkUserIsNotOwner(target);
		await this.checkUserIsNotBanned(target);
		if (target.isOperator && !target.isOwner) {
			await this.checkUserIsOwner(user);
		}

		await this.chatParticipantsService.deleteParticipantByID(target.id);
	}

	private async toggleChatPrivacy(info: UserChatInfo): Promise<boolean> {
		const user = await this.getParticipantOrFail(info);
		const chatRoom = await this.getChatRoomOrFail(info.chatRoomID);

		await this.checkUserIsOwner(user);

		await this.chatsService.updateChatByID(chatRoom.id, {
			isPrivate: !chatRoom.isPrivate,
		});
		const updatedChatRoom = await this.getChatRoomOrFail(info.chatRoomID);
		const isPrivate = updatedChatRoom.isPrivate;
		return isPrivate;
	}

	private async inviteUserToChat(info: UserTargetChat): Promise<sendInviteDto> {
		await this.getParticipantOrFail({
			userID: info.userID,
			chatRoomID: info.chatRoomID,
		});

		const target =
			await this.chatParticipantsService.fetchParticipantEntityByUserChatID({
				userID: info.targetID,
				chatRoomID: info.chatRoomID,
			});
		if (target) {
			throw new InviteCreationError(
				`${target.user.id} cannot be invited: already in chat room ${info.chatRoomID}`
			);
		}
		const invite = await this.inviteService.createInvite({
			type: inviteType.CHAT,
			senderID: info.userID,
			invitedUserID: info.targetID,
			chatRoomID: info.chatRoomID,
		});
		return invite;
	}

	private async inviteUserGeneric(
		info: UserTargetChat
	): Promise<sendInviteDto> {
		const user = await this.userService.fetchUserByID(info.userID);
		const target = await this.userService.fetchUserByID(info.targetID);
		if (!user || !target) {
			throw new InviteCreationError(`User not found`);
		}
		const invite = await this.inviteService.createInvite({
			type: info.inviteType,
			senderID: info.userID,
			invitedUserID: info.targetID,
		});
		return invite;
	}

	private async inviteUser(info: UserTargetChat): Promise<sendInviteDto> {
		switch (info.inviteType) {
			case inviteType.CHAT:
				return this.inviteUserToChat(info);
			case inviteType.GAME:
				return this.inviteUserGeneric(info);
			case inviteType.FRIEND:
				return this.inviteUserGeneric(info);
			default:
				throw new InviteCreationError("invalid invite type");
		}
	}

	private async acceptUserInviteToChatRoom(info: sendInviteDto): Promise<void> {
		try {
			const invite =
				await this.inviteService.fetchInviteByInvitedUserChatRoomID({
					userID: info.invitedID,
					chatRoomID: info.chatRoomID,
				});
			await this.checkUserInviteHasNotExpired(info);

			// TODO: can a banned user be invited to chatroom?
			const user =
				await this.chatParticipantsService.fetchParticipantEntityByUserChatID({
					userID: info.invitedID,
					chatRoomID: info.chatRoomID,
				});
			if (user) {
				await this.checkUserHasNotAlreadyAcceptedInvite(user);
				await this.checkUserIsNotBanned(user);
			}

			await this.chatParticipantsService.createChatParticipant({
				userID: invite.invitedUser.id,
				chatRoomID: invite.chatRoom.id,
			});

			await this.inviteService.deleteInvitesByInvitedUserChatRoomID({
				userID: invite.invitedUser.id,
				chatRoomID: invite.chatRoom.id,
			});
		} catch (e) {
			throw new ChatPermissionError(e.message);
		}
	}

	private async acceptUserInviteToGame(info: sendInviteDto): Promise<void> {
		try {
			this.logger.debug("[Accept user invite to game]:", info);
			const invite = await this.inviteService.fetchInviteByID(info.id);
			if (!invite) {
				throw Error("Can't find invite!");
			}
			await this.checkUserInviteHasNotExpired(info);

			const userIsBlocked =
				await this.blockedUserService.usersAreBlockingEachOtherByUserIDs(
					info.senderID,
					info.invitedID
				);
			if (userIsBlocked) {
				throw new BadRequestException(
					"Cannot accept game invite: a user is blocking another"
				);
			}
		} catch (e) {
			throw new ChatPermissionError(e.message);
		}
	}

	private async acceptUserInviteToFriends(info: sendInviteDto): Promise<void> {
		try {
			this.logger.debug("Accept user Invite to friends", info);
			const invite = await this.inviteService.fetchInviteByID(info.id);
			if (!invite) {
				throw Error("Can't find invite!");
			}
			await this.checkUserInviteHasNotExpired(info);

			const userIsBlocked =
				await this.blockedUserService.usersAreBlockingEachOtherByUserIDs(
					info.senderID,
					info.invitedID
				);
			if (userIsBlocked) {
				throw new BadRequestException(
					"Cannot accept friend invite: a user is blocking another"
				);
			}
			await this.friendService.createFriend({
				userID1: info.senderID,
				userID2: info.invitedID,
			});

			await this.inviteService.deleteInviteByID(invite.id);
		} catch (e) {
			throw new ChatPermissionError(e.message);
		}
	}

	private async acceptChatInvite(
		user: UserEntity,
		info: ReceivedInfoDto,
		@ConnectedSocket() socket: Socket
	): Promise<ReceivedInfoDto> {
		await this.checkChatRoomPassword(
			info.chatInfo.password,
			info.inviteInfo.chatRoomID
		);
		await this.acceptUserInviteToChatRoom(info.inviteInfo);
		info.username = user.username;
		info.token = "";
		const chat = await this.chatsService.fetchChatByID(
			info.inviteInfo.chatRoomID
		);
		info.chatRoomID = chat.id;
		info.chatInfo = {
			name: chat.name,
			isPrivate: chat.isPrivate,
		};
		if (socket.data.userID === info.userID) {
			// Making the participants join the socket room
			await socket.join(
				this.getSocketRoomIdentifier(info.chatRoomID, RoomType.Chat)
			);
		}
		this.server
			.to(this.getSocketRoomIdentifier(info.chatRoomID, RoomType.Chat))
			.emit("accept invite", info);
		return info;
	}

	private async acceptGameInvite(
		user: UserEntity,
		info: ReceivedInfoDto
	): Promise<ReceivedInfoDto> {
		await this.acceptUserInviteToGame(info.inviteInfo);
		info.username = user.username;
		info.token = "";
		// TODO emit to user 1 and 2 to join game
		this.server
			.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
			.emit("accept invite", info);
		return info;
	}

	private async acceptFriendInvite(
		user: UserEntity,
		info: ReceivedInfoDto
	): Promise<ReceivedInfoDto> {
		await this.acceptUserInviteToFriends(info.inviteInfo);
		info.username = user.username;
		info.token = "";
		// TODO emit to user 1 and 2 that they are now friends
		this.server
			.to(this.getSocketRoomIdentifier(info.userID, RoomType.User))
			.emit("accept invite", info);
		return info;
	}

	private async refuseUserInvite(invite: sendInviteDto): Promise<void> {
		try {
			await this.inviteService.deleteInviteByID(invite.id);
		} catch (e) {
			throw new ChatPermissionError(e.message);
		}
	}

	private async deleteChatRoom(info: UserChatInfo): Promise<void> {
		const chat = await this.getChatRoomOrFail(info.chatRoomID);
		const user = await this.getParticipantOrFail(info);

		await this.checkUserIsOwner(user);
		await this.chatsService.deleteChatByID(chat.id);
	}

	private async leaveChatRoom(info: UserChatInfo): Promise<void> {
		await this.chatsService.removeParticipantFromChatByUsername({
			userID: info.userID,
			chatRoomID: info.chatRoomID,
		});
	}

	private async setPassword(
		info: UserChatInfo,
		password: string
	): Promise<void> {
		await this.getChatRoomOrFail(info.chatRoomID);
		const user = await this.getParticipantOrFail(info);

		await this.checkUserIsOwner(user);
		await this.chatsService.updateChatByID(info.chatRoomID, {
			password: password,
		});
	}

	private getSocketRoomIdentifier(id: number, type: RoomType): string {
		switch (type) {
			case RoomType.User:
				return "user" + id.toString();
			default:
				return "chat" + id.toString();
		}
	}
}
