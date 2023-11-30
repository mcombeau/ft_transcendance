import { Inject, forwardRef, Injectable } from "@nestjs/common";
import { sendInviteDto } from "src/invites/dtos/sendInvite.dto";
import { ChatParticipantsService } from "src/chat-participants/chat-participants.service";
import { ChatParticipantEntity } from "src/chat-participants/entities/chat-participant.entity";
import { ChatsService } from "src/chats/chats.service";
import { ChatPermissionError } from "src/exceptions/bad-request.interceptor";
import { InviteEntity } from "src/invites/entities/Invite.entity";
import { InvitesService } from "src/invites/invites.service";
import { UserChatInfo } from "src/chat-participants/utils/types";
import { ChatEntity } from "src/chats/entities/chat.entity";
import { PasswordService } from "src/password/password.service";
import { isInt, isPositive } from "class-validator";

@Injectable()
export class PermissionChecks {
	constructor(
		@Inject(forwardRef(() => ChatsService))
		private chatsService: ChatsService,
		@Inject(forwardRef(() => ChatParticipantsService))
		private chatParticipantsService: ChatParticipantsService,
		@Inject(forwardRef(() => InvitesService))
		private inviteService: InvitesService,
		@Inject(forwardRef(() => PasswordService))
		private passwordService: PasswordService
	) {}

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

	convertInviteIDFromString(inviteID: string): number {
		const convertedInviteID = Number(inviteID);
		if (
			isNaN(convertedInviteID) ||
			!isInt(convertedInviteID) ||
			!isPositive(convertedInviteID)
		)
			return null;
		return convertedInviteID;
	}

	async getValidInvite(
		inviteID: number,
		userID: number
	): Promise<sendInviteDto> {
		if (!inviteID) {
			return null;
		}
		let invitation: sendInviteDto;
		try {
			invitation = await this.inviteService.fetchInviteByID(inviteID);
			if (!invitation) {
				return null;
			}
			if (invitation.invitedID !== userID && invitation.senderID !== userID) {
				return null;
			}
			await this.checkUserInviteHasNotExpired(invitation);
		} catch (e) {
			return null;
		}
		return invitation;
	}
}
