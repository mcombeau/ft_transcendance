import { Inject, forwardRef, Logger, Injectable } from "@nestjs/common";
import { sendInviteDto } from "src/invites/dtos/sendInvite.dto";
import { createChatMessageParams } from "src/chat-messages/utils/types";
import { ConnectedSocket } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { ChatMessagesService } from "src/chat-messages/chat-messages.service";
import { ChatParticipantsService } from "src/chat-participants/chat-participants.service";
import { ChatParticipantEntity } from "src/chat-participants/entities/chat-participant.entity";
import { UserEntity } from "src/users/entities/user.entity";
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
import { BadRequestException } from "@nestjs/common";

export type UserTargetChat = {
	userID: number;
	targetID: number;
	chatRoomID?: number;
	inviteType?: inviteType;
};

export enum RoomType {
	User,
	Chat,
}

@Injectable()
export class ChatsGatewayService {
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
		@Inject(forwardRef(() => PasswordService))
		private passwordService: PasswordService,
		@Inject(forwardRef(() => FriendsService))
		private friendService: FriendsService,
		@Inject(forwardRef(() => BlockedUsersService))
		private blockedUserService: BlockedUsersService
	) {}

	readonly logger: Logger = new Logger("Chat Gateway Service");

	// --------------------  PERMISSION CHECKS

	async getChatRoomOrFail(chatRoomID: number): Promise<ChatEntity> {
		const chatRoom = await this.chatsService.fetchChatByID(chatRoomID);
		if (!chatRoom) {
			throw new ChatPermissionError(`Chat '${chatRoomID} does not exist.`);
		}
		return chatRoom;
	}

	async getParticipantOrFail(
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

	async checkUserIsOwner(user: ChatParticipantEntity): Promise<void> {
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

	async checkUserIsNotOwner(user: ChatParticipantEntity): Promise<void> {
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

	async checkUserHasOperatorPermissions(
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

	async checkUserIsNotOperator(user: ChatParticipantEntity): Promise<void> {
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

	async checkUserIsNotBanned(user: ChatParticipantEntity): Promise<void> {
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

	async checkUserIsNotMuted(user: ChatParticipantEntity): Promise<void> {
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

	async checkUserHasNotAlreadyAcceptedInvite(
		user: ChatParticipantEntity
	): Promise<void> {
		if (user) {
			throw new ChatPermissionError(
				`User '${user.user.username}' has already accepted invite to chat '${user.chatRoom.name}'.`
			);
		}
	}

	async checkChatRoomPassword(
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

	async addUserToChat(info: UserChatInfo): Promise<void> {
		const chatRoom = await this.getChatRoomOrFail(info.chatRoomID);
		if (chatRoom.isPrivate === true) {
			throw new ChatJoinError(`Chat '${info.chatRoomID}' is .`);
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

	async registerChatMessage(
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

	async toggleMute(
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

	async toggleOperator(info: UserTargetChat): Promise<void> {
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

	async banUser(info: UserTargetChat): Promise<boolean> {
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

	async kickUser(info: UserTargetChat): Promise<void> {
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

	async toggleChatPrivacy(info: UserChatInfo): Promise<boolean> {
		const user = await this.getParticipantOrFail(info);
		const chatRoom = await this.getChatRoomOrFail(info.chatRoomID);

		await this.checkUserIsOwner(user);

		await this.chatsService.updateChatByID(chatRoom.id, {
			isPrivate: !chatRoom.isPrivate,
		});
		const updatedChatRoom = await this.getChatRoomOrFail(info.chatRoomID);
		const is = updatedChatRoom.isPrivate;
		return is;
	}

	async inviteUserToChat(info: UserTargetChat): Promise<sendInviteDto> {
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

	async inviteUserGeneric(info: UserTargetChat): Promise<sendInviteDto> {
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

	async inviteUser(info: UserTargetChat): Promise<sendInviteDto> {
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

	async acceptUserInviteToChatRoom(info: sendInviteDto): Promise<void> {
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

	async acceptUserInviteToGame(info: sendInviteDto): Promise<void> {
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

	async acceptUserInviteToFriends(info: sendInviteDto): Promise<void> {
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

	async refuseUserInvite(invite: sendInviteDto): Promise<void> {
		try {
			await this.inviteService.deleteInviteByID(invite.id);
		} catch (e) {
			throw new ChatPermissionError(e.message);
		}
	}

	async deleteChatRoom(info: UserChatInfo): Promise<void> {
		const chat = await this.getChatRoomOrFail(info.chatRoomID);
		const user = await this.getParticipantOrFail(info);

		await this.checkUserIsOwner(user);
		await this.chatsService.deleteChatByID(chat.id);
	}

	async leaveChatRoom(info: UserChatInfo): Promise<void> {
		await this.chatsService.removeParticipantFromChatByUsername({
			userID: info.userID,
			chatRoomID: info.chatRoomID,
		});
	}

	async setPassword(info: UserChatInfo, password: string): Promise<void> {
		await this.getChatRoomOrFail(info.chatRoomID);
		const user = await this.getParticipantOrFail(info);

		await this.checkUserIsOwner(user);
		await this.chatsService.updateChatByID(info.chatRoomID, {
			password: password,
		});
	}

	getSocketRoomIdentifier(id: number, type: RoomType): string {
		switch (type) {
			case RoomType.User:
				return "user" + id.toString();
			default:
				return "chat" + id.toString();
		}
	}
}
