import { Inject, forwardRef, Logger, Injectable } from "@nestjs/common";
import { sendInviteDto } from "src/invites/dtos/sendInvite.dto";
import { createChatMessageParams } from "src/chat-messages/utils/types";
import { ChatMessagesService } from "src/chat-messages/chat-messages.service";
import { ChatParticipantsService } from "src/chat-participants/chat-participants.service";
import { ChatsService } from "src/chats/chats.service";
import { BlockedUsersService } from "src/blocked-users/blockedUsers.service";
import {
	ChatJoinError,
	ChatPermissionError,
	InviteCreationError,
} from "src/exceptions/bad-request.interceptor";
import { inviteType } from "src/invites/entities/Invite.entity";
import { InvitesService } from "src/invites/invites.service";
import { UsersService } from "src/users/users.service";
import { FriendsService } from "src/friends/friends.service";
import { UserChatInfo } from "src/chat-participants/utils/types";
import { BadRequestException } from "@nestjs/common";
import { PermissionChecks } from "./permission-checks";

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
		@Inject(forwardRef(() => FriendsService))
		private friendService: FriendsService,
		@Inject(forwardRef(() => BlockedUsersService))
		private blockedUserService: BlockedUsersService,
		@Inject(forwardRef(() => PermissionChecks))
		private permissionChecks: PermissionChecks
	) {}

	readonly logger: Logger = new Logger("Chat Gateway Service");

	// -------------------- HANDLERS

	async addUserToChat(info: UserChatInfo): Promise<void> {
		const chatRoom = await this.permissionChecks.getChatRoomOrFail(
			info.chatRoomID
		);
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
					`You have been banned from '${chatRoom.name}'.`
				);
			}
			throw new ChatJoinError(`You are already in '${chatRoom.name}'.`);
		}
		if (participant && participant.isBanned) {
			throw new ChatJoinError(`You have been banned from '${chatRoom.name}'.`);
		}
		await this.chatsService.addParticipantToChatByUserChatID(info);
	}

	async registerChatMessage(
		chatMessageDetails: createChatMessageParams
	): Promise<void> {
		const user = await this.permissionChecks.getParticipantOrFail({
			userID: chatMessageDetails.senderID,
			chatRoomID: chatMessageDetails.chatRoomID,
		});

		await this.permissionChecks.checkUserIsNotMuted(user);
		await this.permissionChecks.checkUserIsNotBanned(user);

		await this.chatMessagesService.createMessage(chatMessageDetails);
	}

	async toggleMute(
		chatRoomID: number,
		userID: number,
		targetUserID: number,
		minutes: number
	): Promise<number> {
		const user = await this.permissionChecks.getParticipantOrFail({
			userID: userID,
			chatRoomID: chatRoomID,
		});
		const target = await this.permissionChecks.getParticipantOrFail({
			userID: targetUserID,
			chatRoomID: chatRoomID,
		});

		await this.permissionChecks.checkUserHasOperatorPermissions(user);
		await this.permissionChecks.checkUserIsNotOwner(target);
		await this.permissionChecks.checkUserIsNotBanned(target);

		if (target.isOperator && !target.isOwner) {
			await this.permissionChecks.checkUserIsOwner(user);
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
		const user = await this.permissionChecks.getParticipantOrFail({
			chatRoomID: info.chatRoomID,
			userID: info.userID,
		});
		const target = await this.permissionChecks.getParticipantOrFail({
			chatRoomID: info.chatRoomID,
			userID: info.targetID,
		});

		await this.permissionChecks.checkUserIsOwner(user);
		await this.permissionChecks.checkUserIsNotOwner(target);
		await this.permissionChecks.checkUserIsNotBanned(target);

		await this.chatParticipantsService.updateParticipantByID(target.id, {
			isOperator: !target.isOperator,
		});
	}

	async banUser(info: UserTargetChat): Promise<boolean> {
		const user = await this.permissionChecks.getParticipantOrFail({
			chatRoomID: info.chatRoomID,
			userID: info.userID,
		});
		const target = await this.permissionChecks.getParticipantOrFail({
			chatRoomID: info.chatRoomID,
			userID: info.targetID,
		});

		await this.permissionChecks.checkUserHasOperatorPermissions(user);
		await this.permissionChecks.checkUserIsNotOwner(target);

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
		const user = await this.permissionChecks.getParticipantOrFail({
			chatRoomID: info.chatRoomID,
			userID: info.userID,
		});
		const target = await this.permissionChecks.getParticipantOrFail({
			chatRoomID: info.chatRoomID,
			userID: info.targetID,
		});

		await this.permissionChecks.checkUserHasOperatorPermissions(user);
		await this.permissionChecks.checkUserIsNotOwner(target);
		await this.permissionChecks.checkUserIsNotBanned(target);
		if (target.isOperator && !target.isOwner) {
			await this.permissionChecks.checkUserIsOwner(user);
		}

		await this.chatParticipantsService.deleteParticipantByID(target.id);
	}

	async toggleChatPrivacy(info: UserChatInfo): Promise<boolean> {
		const user = await this.permissionChecks.getParticipantOrFail(info);
		const chatRoom = await this.permissionChecks.getChatRoomOrFail(
			info.chatRoomID
		);

		await this.permissionChecks.checkUserIsOwner(user);

		await this.chatsService.updateChatByID(chatRoom.id, {
			isPrivate: !chatRoom.isPrivate,
		});
		const updatedChatRoom = await this.permissionChecks.getChatRoomOrFail(
			info.chatRoomID
		);
		const is = updatedChatRoom.isPrivate;
		return is;
	}

	async inviteUserToChat(info: UserTargetChat): Promise<sendInviteDto> {
		await this.permissionChecks.getParticipantOrFail({
			userID: info.userID,
			chatRoomID: info.chatRoomID,
		});

		const target =
			await this.chatParticipantsService.fetchParticipantEntityByUserChatID({
				userID: info.targetID,
				chatRoomID: info.chatRoomID,
			});
		const chatRoom = await this.chatsService.fetchChatByID(info.chatRoomID);
		if (target) {
			if (target.isBanned) {
				throw new InviteCreationError(
					`${target.user.username} is banned from chat room ${chatRoom.name}`
				);
			}
			throw new InviteCreationError(
				`${target.user.username} is already in chat room ${chatRoom.name}`
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
			await this.permissionChecks.checkUserInviteHasNotExpired(info);

			const user =
				await this.chatParticipantsService.fetchParticipantEntityByUserChatID({
					userID: info.invitedID,
					chatRoomID: info.chatRoomID,
				});
			if (user) {
				await this.permissionChecks.checkUserHasNotAlreadyAcceptedInvite(user);
				await this.permissionChecks.checkUserIsNotBanned(user);
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
			await this.permissionChecks.checkUserInviteHasNotExpired(info);

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
			await this.permissionChecks.checkUserInviteHasNotExpired(info);

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
		const chat = await this.permissionChecks.getChatRoomOrFail(info.chatRoomID);
		const user = await this.permissionChecks.getParticipantOrFail(info);

		await this.permissionChecks.checkUserIsOwner(user);
		await this.chatsService.deleteChatByID(chat.id);
	}

	async leaveChatRoom(info: UserChatInfo): Promise<void> {
		await this.chatsService.removeParticipantFromChatByUsername({
			userID: info.userID,
			chatRoomID: info.chatRoomID,
		});
	}

	async setPassword(info: UserChatInfo, password: string): Promise<void> {
		await this.permissionChecks.getChatRoomOrFail(info.chatRoomID);
		const user = await this.permissionChecks.getParticipantOrFail(info);

		await this.permissionChecks.checkUserIsOwner(user);
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
