import {
	OnModuleInit,
	Inject,
	forwardRef,
	ValidationPipe,
	UsePipes,
	UseFilters,
	Logger,
} from "@nestjs/common";
import {
	ConnectedSocket,
	MessageBody,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChatParticipantsService } from "src/chat-participants/chat-participants.service";
import { ChatsService } from "src/chats/chats.service";
import { InviteCreationError } from "src/exceptions/bad-request.interceptor";
import { inviteType } from "src/invites/entities/Invite.entity";
import { UsersService } from "src/users/users.service";
import { ReceivedInfoDto } from "./dtos/chatGateway.dto";
import { ChatEntity } from "src/chats/entities/chat.entity";
import { WebsocketExceptionsFilter } from "src/exceptions/websocket-exception.filter";
import { SocketGateway } from "./socket.gateway";
import {
	ChatsGatewayService,
	RoomType,
	UserTargetChat,
} from "./chat.gateway.service";
import { UserEntity } from "src/users/entities/user.entity";
import { PermissionChecks } from "./permission-checks";

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
		@Inject(forwardRef(() => ChatsService))
		private chatsService: ChatsService,
		@Inject(forwardRef(() => ChatParticipantsService))
		private chatParticipantsService: ChatParticipantsService,
		@Inject(forwardRef(() => UsersService))
		private userService: UsersService,
		@Inject(forwardRef(() => SocketGateway))
		private socketGateway: SocketGateway,
		@Inject(forwardRef(() => ChatsGatewayService))
		private chatGatewayService: ChatsGatewayService,
		@Inject(forwardRef(() => PermissionChecks))
		private permissionChecks: PermissionChecks
	) {}

	@WebSocketServer()
	server: Server;

	private readonly logger: Logger = new Logger("Chat Gateway");

	onModuleInit() {}

	async joinSocketRooms(socket: Socket, userID: number) {
		// Join channel named by the id of the user
		socket.data.userID = userID;
		await socket.join(
			this.chatGatewayService.getSocketRoomIdentifier(userID, RoomType.User)
		);
		// Join all the channels the user is part of
		const chats = await this.userService.fetchUserChatsByUserID(userID);
		chats.map(async (chatRoom: ChatEntity) => {
			await socket.join(
				this.chatGatewayService.getSocketRoomIdentifier(
					chatRoom.id,
					RoomType.Chat
				)
			); // Name of the socket room is the string id of the channel
		});
	}

	@SubscribeMessage("add chat")
	async onAddChat(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.socketGateway.checkIdentity(info.token, socket);
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
					this.chatGatewayService.getSocketRoomIdentifier(
						info.chatRoomID,
						RoomType.Chat
					)
				);
			}
			info.token = "";
			this.server.emit("add chat", info);
		} catch (e) {
			this.logger.error(`[Add Chat]: ${e.message}`);
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.userID,
						RoomType.User
					)
				)
				.emit("error", "Chat creation error: " + e.message);
		}
	}

	@SubscribeMessage("leave socket room")
	async onLeaveSocketRoom(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.socketGateway.checkIdentity(info.token, socket);
			const userParticipant =
				await this.chatParticipantsService.fetchParticipantEntityByUserChatID({
					userID: info.userID,
					chatRoomID: info.chatRoomID,
				});
			if (!userParticipant || userParticipant.isBanned) {
				await socket.leave(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.chatRoomID,
						RoomType.Chat
					)
				);
			}
		} catch (e) {
			this.logger.error(`[Leave Socket Room]: ${e.message}`);
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.userID,
						RoomType.User
					)
				)
				.emit("error", "Leave socket room error: " + e.message);
		}
	}

	@SubscribeMessage("join socket room")
	async onJoinSocketRoom(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.socketGateway.checkIdentity(info.token, socket);
			const userParticipant =
				await this.chatParticipantsService.fetchParticipantEntityByUserChatID({
					userID: info.userID,
					chatRoomID: info.chatRoomID,
				});
			if (userParticipant) {
				await socket.join(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.chatRoomID,
						RoomType.Chat
					)
				);
			}
		} catch (e) {
			this.logger.error(`[Join Socket Room]: ${e.message}`);
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.userID,
						RoomType.User
					)
				)
				.emit("error", "Join Socket Room error " + e.message);
		}
	}

	@SubscribeMessage("dm")
	async onDM(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.socketGateway.checkIdentity(info.token, socket);

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
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.userID,
						RoomType.User
					)
				)
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.targetID,
						RoomType.User
					)
				)
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
			info.userID = await this.socketGateway.checkIdentity(info.token, socket);
			this.chatGatewayService.deleteChatRoom({
				userID: info.userID,
				chatRoomID: info.chatRoomID,
			});
			info.token = "";
			this.server.emit("delete chat", info);
		} catch (e) {
			this.logger.error(`[Delete Chat]: ${e.message}`);
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.userID,
						RoomType.User
					)
				)
				.emit("error", "Delete chat error: ", e.message);
		}
	}

	@SubscribeMessage("join chat")
	async onJoinChat(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.socketGateway.checkIdentity(info.token, socket);
			const user = await this.userService.fetchUserByID(info.userID);
			if (info.chatInfo && info.chatInfo.password !== undefined) {
				await this.permissionChecks.checkChatRoomPassword(
					info.chatInfo.password,
					info.chatRoomID
				);
			}
			await this.chatGatewayService.addUserToChat({
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
					this.chatGatewayService.getSocketRoomIdentifier(
						info.chatRoomID,
						RoomType.Chat
					)
				);
			}
			info.token = "";
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.chatRoomID,
						RoomType.Chat
					)
				)
				.emit("join chat", info);
		} catch (e) {
			this.logger.error(`[Join Chat]: ${e.message}`);
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.userID,
						RoomType.User
					)
				)
				.emit("error", "Join chat error: " + e.message);
		}
	}

	@SubscribeMessage("leave chat")
	async onLeaveChat(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.socketGateway.checkIdentity(info.token, socket);
			info.username = (
				await this.userService.fetchUserByID(info.userID)
			).username;
			await this.chatGatewayService.leaveChatRoom({
				userID: info.userID,
				chatRoomID: info.chatRoomID,
			});

			info.token = "";
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.chatRoomID,
						RoomType.Chat
					)
				)
				.emit("leave chat", info);
			if (socket.data.userID === info.userID) {
				// Making the participant leave the socket room
				await socket.leave(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.chatRoomID,
						RoomType.Chat
					)
				);
			}
		} catch (e) {
			this.logger.error(`[Leave Chat]: ${e.message}`);
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.userID,
						RoomType.User
					)
				)
				.emit("error", "Leave Chat:" + e.message);
		}
	}

	@SubscribeMessage("chat message")
	async onChatMessage(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			const userID = await this.socketGateway.checkIdentity(info.token, socket);
			info.userID = userID;
			info.messageInfo.senderID = userID;
			info.messageInfo.chatRoomID = info.chatRoomID;
			const user = await this.userService.fetchUserByID(info.userID);
			info.username = user.username;
			await this.chatGatewayService.registerChatMessage(info.messageInfo);

			info.token = "";
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.chatRoomID,
						RoomType.Chat
					)
				)
				.emit("chat message", info);
		} catch (e) {
			this.logger.error(`[Chat Message]: ${e.message}`);
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.userID,
						RoomType.User
					)
				)
				.emit("error", "Chat message error: " + e.message);
		}
	}

	@SubscribeMessage("mute")
	async onMute(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.socketGateway.checkIdentity(info.token, socket);
			info.username = (
				await this.userService.fetchUserByID(info.targetID)
			).username;
			info.participantInfo.mutedUntil =
				await this.chatGatewayService.toggleMute(
					info.chatRoomID,
					info.userID,
					info.targetID,
					info.participantInfo.mutedUntil
				);
			info.token = "";
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.chatRoomID,
						RoomType.Chat
					)
				)
				.emit("mute", info);
		} catch (e) {
			this.logger.error(`[Mute User]: ${e.message}`);
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.userID,
						RoomType.User
					)
				)
				.emit("error", "Mute: " + e.message);
		}
	}

	@SubscribeMessage("toggle private")
	async onTogglePrivate(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.socketGateway.checkIdentity(info.token, socket);
			info.username = (
				await this.userService.fetchUserByID(info.userID)
			).username;
			const chat = await this.permissionChecks.getChatRoomOrFail(
				info.chatRoomID
			);
			info = {
				...info,
				chatInfo: {
					isPrivate: await this.chatGatewayService.toggleChatPrivacy({
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
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.userID,
						RoomType.User
					)
				)
				.emit("error", "Toggle private error: " + e.message);
		}
	}

	@SubscribeMessage("invite")
	async onInvite(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.socketGateway.checkIdentity(info.token, socket);
			const inviteDetails: UserTargetChat = {
				inviteType: info.inviteInfo.type,
				userID: info.userID,
				targetID: info.targetID,
			};
			if (info.chatRoomID && info.inviteInfo.type === inviteType.CHAT) {
				inviteDetails.chatRoomID = info.chatRoomID;
			}
			const invite = await this.chatGatewayService.inviteUser(inviteDetails);
			info.inviteInfo = invite;
			info.inviteInfo.chatHasPassword =
				await this.chatsService.fetchChatHasPasswordByID(info.chatRoomID);
			info.token = "";
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.inviteInfo.invitedID,
						RoomType.User
					)
				)
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.inviteInfo.senderID,
						RoomType.User
					)
				)
				.emit("invite", info);
		} catch (e) {
			this.logger.error(`[Invite User]: ${e.message}`);
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.userID,
						RoomType.User
					)
				)
				.emit("error", "Invite: " + e.message);
		}
	}

	@SubscribeMessage("accept invite")
	async onAcceptInvite(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.socketGateway.checkIdentity(info.token, socket);
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
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.userID,
						RoomType.User
					)
				)
				.emit("error", "Accept Invite: " + e.message);
		}
	}

	async acceptChatInvite(
		user: UserEntity,
		info: ReceivedInfoDto,
		@ConnectedSocket() socket: Socket
	): Promise<ReceivedInfoDto> {
		await this.permissionChecks.checkChatRoomPassword(
			info.chatInfo.password,
			info.inviteInfo.chatRoomID
		);
		await this.chatGatewayService.acceptUserInviteToChatRoom(info.inviteInfo);
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
				this.chatGatewayService.getSocketRoomIdentifier(
					info.chatRoomID,
					RoomType.Chat
				)
			);
		}
		this.server
			.to(
				this.chatGatewayService.getSocketRoomIdentifier(
					info.chatRoomID,
					RoomType.Chat
				)
			)
			.emit("accept invite", info);
		return info;
	}

	async acceptGameInvite(
		user: UserEntity,
		info: ReceivedInfoDto
	): Promise<ReceivedInfoDto> {
		await this.chatGatewayService.acceptUserInviteToGame(info.inviteInfo);
		info.username = user.username;
		info.token = "";
		this.server
			.to(
				this.chatGatewayService.getSocketRoomIdentifier(
					info.userID,
					RoomType.User
				)
			)
			.emit("accept invite", info);
		return info;
	}

	async acceptFriendInvite(
		user: UserEntity,
		info: ReceivedInfoDto
	): Promise<ReceivedInfoDto> {
		await this.chatGatewayService.acceptUserInviteToFriends(info.inviteInfo);
		info.username = user.username;
		info.token = "";
		this.server
			.to(
				this.chatGatewayService.getSocketRoomIdentifier(
					info.userID,
					RoomType.User
				)
			)
			.emit("accept invite", info);
		return info;
	}

	@SubscribeMessage("refuse invite")
	async onRefuseInvite(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.socketGateway.checkIdentity(info.token, socket);
			await this.chatGatewayService.refuseUserInvite(info.inviteInfo);
			info.token = "";
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.userID,
						RoomType.User
					)
				)
				.emit("refuse invite", info);
		} catch (e) {
			this.logger.error(`[Refuse Invite]: ${e.message}`);
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.userID,
						RoomType.User
					)
				)
				.emit("error", "Refuse Invite: " + e.message);
		}
	}

	@SubscribeMessage("operator")
	async onMakeOperator(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.socketGateway.checkIdentity(info.token, socket);
			const user = await this.userService.fetchUserByID(info.targetID);
			info.username = user.username;
			await this.chatGatewayService.toggleOperator({
				userID: info.userID,
				targetID: info.targetID,
				chatRoomID: info.chatRoomID,
			});
			const participant = await this.permissionChecks.getParticipantOrFail({
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
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.chatRoomID,
						RoomType.Chat
					)
				)
				.emit("operator", info);
		} catch (e) {
			this.logger.error(`[Add Operator]: ${e.message}`);
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.userID,
						RoomType.User
					)
				)
				.emit("error", "Add operator: " + e.message);
		}
	}

	@SubscribeMessage("ban")
	async onBan(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.socketGateway.checkIdentity(info.token, socket);
			info.username = (
				await this.userService.fetchUserByID(info.targetID)
			).username;
			const isBanned = await this.chatGatewayService.banUser({
				userID: info.userID,
				targetID: info.targetID,
				chatRoomID: info.chatRoomID,
			});
			const chatRoom = await this.chatsService.fetchChatByID(info.chatRoomID);
			info = {
				...info,
				participantInfo: {
					isBanned: isBanned,
				},
			};
			info.chatInfo = {
				name: chatRoom.name,
			};
			info.token = "";
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.chatRoomID,
						RoomType.Chat
					)
				)
				.emit("ban", info);
			if (info.targetID === socket.data.userID) {
				await socket.leave(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.chatRoomID,
						RoomType.Chat
					)
				);
			}
		} catch (e) {
			this.logger.error(`[Ban User]: ${e.message}`);
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.userID,
						RoomType.User
					)
				)
				.emit("error", "User ban error: " + e.message);
		}
	}

	@SubscribeMessage("kick")
	async onKick(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.socketGateway.checkIdentity(info.token, socket);
			info.username = (
				await this.userService.fetchUserByID(info.targetID)
			).username;

			await this.chatGatewayService.kickUser({
				userID: info.userID,
				targetID: info.targetID,
				chatRoomID: info.chatRoomID,
			});

			info.token = "";
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.chatRoomID,
						RoomType.Chat
					)
				)
				.emit("kick", info);
		} catch (e) {
			this.logger.error(`[Kick User]: ${e.message}`);
			this.server
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.userID,
						RoomType.User
					)
				)
				.emit("error", "User kick error: " + e.message);
		}
	}

	@SubscribeMessage("set password")
	async onSetPassword(
		@ConnectedSocket() socket: Socket,
		@MessageBody() info: ReceivedInfoDto
	): Promise<void> {
		try {
			info.userID = await this.socketGateway.checkIdentity(info.token, socket);

			await this.chatGatewayService.setPassword(
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
				.to(
					this.chatGatewayService.getSocketRoomIdentifier(
						info.userID,
						RoomType.User
					)
				)
				.emit("error", "Set password error: " + e.message);
		}
	}
}
