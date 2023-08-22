import { OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { createChatMessageParams } from 'src/chat-messages/utils/types';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { ChatMessagesService } from 'src/chat-messages/chat-messages.service';
import { ChatParticipantsService } from 'src/chat-participants/chat-participants.service';
import { ChatParticipantEntity } from 'src/chat-participants/entities/chat-participant.entity';
import { ChatsService } from 'src/chats/chats.service';
import {
  ChatJoinError,
  ChatPermissionError,
  InviteCreationError,
} from 'src/exceptions/bad-request.interceptor';
import { InviteEntity, inviteType } from 'src/invites/entities/Invite.entity';
import { InvitesService } from 'src/invites/invites.service';
import { UsersService } from 'src/users/users.service';
import { UserChatInfo } from 'src/chat-participants/utils/types';
import { ChatNotFoundError } from 'src/exceptions/not-found.interceptor';
import { ReceivedInfoDto } from './dtos/chatGateway.dto';

type UserTargetChat = {
  userID: number;
  targetID: number;
  chatRoomID: number;
};

// TODO [mcombeau]: Make WSExceptionFilter to translate HTTP exceptions
//                  to Websocket exceptions
// TODO: link users and sockets so that we don't send to everyone
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost'],
  },
})
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
  ) {}
  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log('[Chat Gateway]: A user connected', socket.id);
      socket.broadcast.emit('connection event');
      socket.on('disconnect', () => {
        console.log('[Chat Gateway]: A user disconnected', socket.id);
        socket.broadcast.emit('disconnection event');
      });
    });
  }

  // -------------------- EVENTS
  async checkIdentity(token: string) {
    var isVerified = await this.authService
      .validateToken(token)
      .catch(() => {
        return false;
      })
      .finally(() => {
        return true;
      });
    if (!token || !isVerified) {
      throw new ChatPermissionError('User not authenticated');
    }
    return isVerified.userID;
  }

  @SubscribeMessage('add chat')
  async onAddChat(@MessageBody() info: ReceivedInfoDto) {
    console.log('[Chat Gateway]: Add chat', info);
    try {
      info.userID = await this.checkIdentity(info.token);
      info.chatInfo.ownerID = info.userID;
      const owner = await this.userService.fetchUserByID(info.userID);
      info.username = owner.username;
      const chat = await this.chatsService.createChat(info.chatInfo);
      info.chatRoomID = chat.id;
      this.server.emit('add chat', info);
    } catch (e) {
      var err_msg = '[Chat Gateway]: Chat creation error:' + e.message;
      console.log(err_msg);
      this.server.emit('error', err_msg);
    }
  }

  @SubscribeMessage('dm')
  async onDM(@MessageBody() info: ReceivedInfoDto) {
    try {
      info.userID = await this.checkIdentity(info.token);

      const chat = await this.chatsService.createChatDM({
        userID1: info.userID,
        userID2: info.targetID,
      });
      const user2 = await this.userService.fetchUserByID(info.targetID);
      info.chatRoomID = chat.id;
      info.username = user2.username;
      this.server.emit('dm', info);
    } catch (e) {
      var err_msg = '[Chat Gateway]: DM creation error:' + e.message;
      console.log(err_msg);
      this.server.emit('error', err_msg);
    }
  }

  @SubscribeMessage('delete chat')
  async onDeleteChat(@MessageBody() info: ReceivedInfoDto) {
    console.log('[Chat Gateway]: Delete chat', info);
    try {
      info.userID = await this.checkIdentity(info.token);
      this.deleteChatRoom({ userID: info.userID, chatRoomID: info.chatRoomID });
      this.server.emit('delete chat', info);
    } catch (e) {
      var err_msg = '[Chat Gateway]: Chat deletion error:' + e.message;
      console.log(err_msg);
      this.server.emit('error', err_msg);
    }
  }

  @SubscribeMessage('join chat')
  async onJoinChat(@MessageBody() info: ReceivedInfoDto) {
    console.log('[Chat Gateway]: Join chat', info);
    try {
      info.userID = await this.checkIdentity(info.token);
      const user = await this.userService.fetchUserByID(info.userID);
      await this.addUserToChat({
        userID: info.userID,
        chatRoomID: info.chatRoomID,
      });
      info.username = user.username;
      this.server.emit('join chat', info);
    } catch (e) {
      var err_msg = '[Chat Gateway]: Chat join error:' + e.message;
      console.log(err_msg);
      this.server.emit('error', err_msg);
    }
  }

  @SubscribeMessage('leave chat')
  async onLeaveChat(@MessageBody() info: ReceivedInfoDto) {
    try {
      info.userID = await this.checkIdentity(info.token);
      await this.chatsService.removeParticipantFromChatByUsername({
        userID: info.userID,
        chatRoomID: info.chatRoomID,
      });
      this.server.emit('leave chat', info);
    } catch (e) {
      var err_msg = '[Chat Gateway]: Chat leave error:' + e.message;
      console.log(err_msg);
      this.server.emit(err_msg);
    }
  }

  @SubscribeMessage('chat message')
  async onChatMessage(@MessageBody() info: ReceivedInfoDto) {
    console.log('[Chat Gateway]: Sending chat message');
    try {
      var userID = await this.checkIdentity(info.token);
      info.userID = userID;
      info.messageInfo.senderID = userID;
      info.messageInfo.chatRoomID = info.chatRoomID;
      console.log('SENDERID: ', info.userID);
      var user = await this.userService.fetchUserByID(info.userID);
      console.log('SENDER: ', user);
      info.username = user.username;
      await this.registerChatMessage(info.messageInfo);
      this.server.emit('chat message', info);
    } catch (e) {
      var err_msg =
        '[Chat Gateway]: Chat message registration error:' + e.message;
      console.log(err_msg);
      this.server.emit(err_msg);
    }
  }

  @SubscribeMessage('mute')
  async onMute(@MessageBody() info: ReceivedInfoDto) {
    try {
      info.userID = await this.checkIdentity(info.token);
      info.username = (
        await this.userService.fetchUserByID(info.targetID)
      ).username;
      info.participantInfo.mutedUntil = await this.toggleMute(
        info.chatRoomID,
        info.userID,
        info.targetID,
        info.participantInfo.mutedUntil,
      );
      this.server.emit('mute', info);
    } catch (e) {
      var err_msg = '[Chat Gateway]: User mute error:' + e.message;
      console.log(err_msg);
      this.server.emit(err_msg);
    }
  }

  @SubscribeMessage('toggle private')
  async onTogglePrivate(@MessageBody() info: ReceivedInfoDto) {
    console.log('[Chat Gateway]: Toggle private chat');
    try {
      info.userID = await this.checkIdentity(info.token);
      info.username = (
        await this.userService.fetchUserByID(info.userID)
      ).username;
      var chat = await this.chatsService.fetchChatByID(info.chatRoomID);
      info = {
        ...info,
        chatInfo: {
          isPrivate: await this.toggleChatPrivacy({
            userID: info.userID,
            chatRoomID: info.chatRoomID,
          }),
          name: chat.name,
        },
      };

      this.server.emit('toggle private', info);
    } catch (e) {
      var err_msg = '[Chat Gateway]: Chat privacy toggle error:' + e.message;
      console.log(err_msg);
      this.server.emit(err_msg);
    }
  }

  @SubscribeMessage('invite')
  async onInvite(@MessageBody() info: ReceivedInfoDto) {
    try {
      info.userID = await this.checkIdentity(info.token);
      info.username = (
        await this.userService.fetchUserByID(info.targetID)
      ).username;
      var inviteExpiry = await this.inviteUser({
        userID: info.userID,
        targetID: info.targetID,
        chatRoomID: info.chatRoomID,
      });
      info.inviteDate = inviteExpiry;
      this.server.emit('invite', info);
    } catch (e) {
      var err_msg = '[Chat Gateway]: Chat invite error:' + e.message;
      console.log(err_msg);
      this.server.emit(err_msg);
    }
  }

  @SubscribeMessage('accept invite')
  async onAcceptInvite(@MessageBody() info: ReceivedInfoDto) {
    try {
      info.userID = await this.checkIdentity(info.token);
      const user = await this.userService.fetchUserByID(info.targetID);
      info.username = user.username;
      await this.acceptUserInvite({
        userID: info.userID,
        chatRoomID: info.chatRoomID,
      });
      this.server.emit('accept invite', info);
    } catch (e) {
      var err_msg = '[Chat Gateway]: Chat accept invite error:' + e.message;
      console.log(err_msg);
      this.server.emit(err_msg);
    }
  }

  @SubscribeMessage('operator')
  async onMakeOperator(@MessageBody() info: ReceivedInfoDto) {
    try {
      info.userID = await this.checkIdentity(info.token);
      info.username = (
        await this.userService.fetchUserByID(info.targetID)
      ).username;
      await this.toggleOperator({
        userID: info.userID,
        targetID: info.targetID,
        chatRoomID: info.chatRoomID,
      });
      this.server.emit('operator', info);
    } catch (e) {
      console.log('[Chat Gateway]: Operator promotion error:', e.message);
    }
  }

  @SubscribeMessage('ban')
  async onBan(@MessageBody() info: ReceivedInfoDto) {
    try {
      info.userID = await this.checkIdentity(info.token);
      info.username = (
        await this.userService.fetchUserByID(info.targetID)
      ).username;
      await this.banUser({
        userID: info.userID,
        targetID: info.targetID,
        chatRoomID: info.chatRoomID,
      });
      this.server.emit('ban', info);
    } catch (e) {
      var err_msg = '[Chat Gateway]: User ban error:' + e.message;
      console.log(err_msg);
      this.server.emit(err_msg);
    }
  }

  @SubscribeMessage('kick')
  async onKick(@MessageBody() info: ReceivedInfoDto) {
    try {
      info.userID = await this.checkIdentity(info.token);
      info.username = (
        await this.userService.fetchUserByID(info.targetID)
      ).username;
      await this.kickUser({
        userID: info.userID,
        targetID: info.targetID,
        chatRoomID: info.chatRoomID,
      });
      this.server.emit('kick', info);
    } catch (e) {
      var err_msg = '[Chat Gateway]: User kick error:' + e.message;
      console.log(err_msg);
      this.server.emit(err_msg);
    }
  }

  // --------------------  PERMISSION CHECKS

  private async getParticipant(info: UserChatInfo) {
    const chatRoom = await this.chatsService.fetchChatByID(info.chatRoomID);
    if (!chatRoom) {
      throw new ChatPermissionError(
        `Chat number '${info.chatRoomID} does not exist.`,
      );
    }
    const userParticipant =
      await this.chatParticipantsService.fetchParticipantByUserChatID(info);
    if (!userParticipant) {
      throw new ChatPermissionError(
        `User '${info.userID} is not in or invited to chat '${info.chatRoomID}`,
      );
    }
    return userParticipant;
  }

  private async checkUserIsOwner(user: ChatParticipantEntity) {
    if (!user) {
      throw new ChatPermissionError(
        `Unexpected error during owner permission check: participant does not exist.`,
      );
    }
    if (!user.owner) {
      throw new ChatPermissionError(
        `User '${user.user.username}' is not owner of chat '${user.chatRoom.name}'.`,
      );
    }
  }

  private async checkUserIsNotOwner(user: ChatParticipantEntity) {
    if (!user) {
      throw new ChatPermissionError(
        `Unexpected error during owner permission check: participant does not exist.`,
      );
    }
    if (user.owner) {
      throw new ChatPermissionError(
        `User '${user.user.username}' is owner of chat '${user.chatRoom.name}'.`,
      );
    }
  }

  private async checkUserHasOperatorPermissions(user: ChatParticipantEntity) {
    if (!user) {
      throw new ChatPermissionError(
        `Unexpected error during operator permission check: participant does not exist.`,
      );
    }
    if (!user.operator && !user.owner) {
      throw new ChatPermissionError(
        `User '${user.user.username}' does not have operator privileges in chat '${user.chatRoom.name}'.`,
      );
    }
  }

  private async checkUserIsNotOperator(user: ChatParticipantEntity) {
    if (!user) {
      throw new ChatPermissionError(
        `Unexpected error during operator permission check: participant does not exist.`,
      );
    }
    if (user.operator || user.owner) {
      throw new ChatPermissionError(
        `User '${user.user.username}' is operator of chat '${user.chatRoom.name}'.`,
      );
    }
  }

  private async checkUserIsNotBanned(user: ChatParticipantEntity) {
    if (!user) {
      throw new ChatPermissionError(
        `Unexpected error during operator permission check: participant does not exist.`,
      );
    }
    if (user.banned) {
      throw new ChatPermissionError(
        `User '${user.user.username}' is banned from chat '${user.chatRoom.name}'.`,
      );
    }
  }

  private async checkUserIsNotMuted(user: ChatParticipantEntity) {
    if (!user) {
      throw new ChatPermissionError(
        `Unexpected error during muted check: participant does not exist.`,
      );
    }
    if (user.mutedUntil > new Date().getTime()) {
      throw new ChatPermissionError(
        `User '${user.user.username}' is muted in chat '${user.chatRoom.name}'.`,
      );
    }
  }

  private async checkUserInviteIsNotPending(invite: InviteEntity) {
    if (!invite) {
      throw new ChatPermissionError(
        `Unexpected error during invite check: invite does not exist.`,
      );
    }
    if (invite.expiresAt > new Date().getTime()) {
      throw new ChatPermissionError(
        `User '${invite.invitedUser.username}' invite to chat '${invite.chatRoom.name}' is pending.`,
      );
    }
  }

  private async checkUserInviteHasNotExpired(info: UserChatInfo) {
    const invite = await this.inviteService.fetchInviteByInvitedUserChatRoomID(
      info,
    );
    if (!invite) {
      throw new ChatPermissionError(
        `User '${info.userID}' has not been invited to chat '${info.chatRoomID}'.`,
      );
    }
    if (invite.expiresAt < new Date().getTime()) {
      this.inviteService.deleteInviteByID(invite.id);
      throw new ChatPermissionError(
        `User '${info.userID}' invite to chat '${info.chatRoomID}' has expired.`,
      );
    }
  }

  private async checkUserHasNotAlreadyAcceptedInvite(
    user: ChatParticipantEntity,
  ) {
    if (user) {
      throw new ChatPermissionError(
        `User '${user.user.username}' has already accepted invite to chat '${user.chatRoom.name}'.`,
      );
    }
  }

  // -------------------- HANDLERS

  private async addUserToChat(info: UserChatInfo) {
    const chatRoom = await this.chatsService.fetchChatByID(info.chatRoomID);
    const participant =
      await this.chatParticipantsService.fetchParticipantByUserChatID(info);
    if (!chatRoom) {
      throw new ChatJoinError(`Chat '${info.chatRoomID}' does not exist.`);
    }
    if (chatRoom.isPrivate === true) {
      throw new ChatJoinError(`Chat '${info.chatRoomID}' is private.`);
    }
    if (participant) {
      throw new ChatJoinError(
        `User '${info.userID}' is already in chat '${info.chatRoomID}'.`,
      );
    }
    if (participant && participant.banned) {
      throw new ChatJoinError(
        `User '${info.userID}' is banned from chat '${info.chatRoomID}'.`,
      );
    }
    this.chatsService.addParticipantToChatByUserChatID(info);
  }

  private async registerChatMessage(
    chatMessageDetails: createChatMessageParams,
  ) {
    console.log('Message details: ', chatMessageDetails);
    const user = await this.getParticipant({
      userID: chatMessageDetails.senderID,
      chatRoomID: chatMessageDetails.chatRoomID,
    });

    await this.checkUserIsNotMuted(user);
    await this.checkUserIsNotBanned(user);

    await this.chatMessagesService.createMessage(chatMessageDetails);
  }

  // TODO: deal with unmute (maybe if muteduntil <= 0 unmute ?)
  private async toggleMute(
    chatRoomID: number,
    userID: number,
    targetUserID: number,
    minutes: number,
  ) {
    const user = await this.getParticipant({
      userID: userID,
      chatRoomID: chatRoomID,
    });
    const target = await this.getParticipant({
      userID: targetUserID,
      chatRoomID: chatRoomID,
    });

    await this.checkUserHasOperatorPermissions(user);
    await this.checkUserIsNotOperator(target);
    await this.checkUserIsNotBanned(target);

    if (user.mutedUntil > new Date().getTime()) {
      var newMutedTimestamp = new Date().getTime();
    } else {
      newMutedTimestamp = new Date(
        Date.now() + minutes * (60 * 1000),
      ).getTime();
    }
    await this.chatParticipantsService.updateParticipantByID(target.id, {
      mutedUntil: newMutedTimestamp,
    });
    return newMutedTimestamp;
  }

  private async toggleOperator(info: UserTargetChat) {
    const user = await this.getParticipant({
      chatRoomID: info.chatRoomID,
      userID: info.userID,
    });
    const target = await this.getParticipant({
      chatRoomID: info.chatRoomID,
      userID: info.targetID,
    });

    await this.checkUserIsOwner(user);
    await this.checkUserIsNotOwner(target);
    await this.checkUserIsNotBanned(target);

    this.chatParticipantsService.updateParticipantByID(target.id, {
      operator: !target.operator,
    });
  }

  private async banUser(info: UserTargetChat) {
    const user = await this.getParticipant({
      chatRoomID: info.chatRoomID,
      userID: info.userID,
    });
    const target = await this.getParticipant({
      chatRoomID: info.chatRoomID,
      userID: info.targetID,
    });

    await this.checkUserHasOperatorPermissions(user);
    await this.checkUserIsNotOwner(target);

    if (target.banned) {
      this.chatParticipantsService.deleteParticipantByID(target.id);
    } else {
      this.chatParticipantsService.updateParticipantByID(target.id, {
        banned: true,
      });
    }
  }

  private async kickUser(info: UserTargetChat) {
    const user = await this.getParticipant({
      chatRoomID: info.chatRoomID,
      userID: info.userID,
    });
    const target = await this.getParticipant({
      chatRoomID: info.chatRoomID,
      userID: info.targetID,
    });

    await this.checkUserHasOperatorPermissions(user);
    await this.checkUserIsNotOwner(target);
    await this.checkUserIsNotBanned(target);

    this.chatParticipantsService.deleteParticipantByID(target.id);
  }

  private async toggleChatPrivacy(info: UserChatInfo) {
    const user = await this.getParticipant(info);
    const chatRoom = await this.chatsService.fetchChatByID(info.chatRoomID);

    console.log('gateway toggle info', info);
    console.log('gateway toggle room', chatRoom);
    await this.checkUserIsOwner(user);

    await this.chatsService.updateChatByID(chatRoom.id, {
      isPrivate: !chatRoom.isPrivate,
    });
    console.log('HERE');
    var updatedChatRoom = await this.chatsService.fetchChatByID(
      info.chatRoomID,
    );
    console.log('HERE', updatedChatRoom);
    var isPrivate = updatedChatRoom.isPrivate;
    console.log('HERE', isPrivate);
    return isPrivate;
  }

  private async inviteUser(info: UserTargetChat) {
    const user = await this.getParticipant({
      userID: info.userID,
      chatRoomID: info.chatRoomID,
    });
    if (!user) {
      throw new InviteCreationError(
        `${info.userID} cannot invite: invite sender not in chat room.`,
      );
    }

    var target =
      await this.chatParticipantsService.fetchParticipantByUserChatID({
        userID: info.targetID,
        chatRoomID: info.chatRoomID,
      });
    if (target) {
      throw new InviteCreationError(
        `${target.user.id} cannot be invited: already in chat room ${info.chatRoomID}`,
      );
    }
    const invite = await this.inviteService.createInvite({
      type: inviteType.CHAT,
      senderID: info.userID,
      invitedUserID: info.targetID,
      chatRoomID: info.chatRoomID,
    });
    return invite.expiresAt;
  }

  private async acceptUserInvite(info: UserChatInfo) {
    try {
      const invite =
        await this.inviteService.fetchInviteByInvitedUserChatRoomID(info);
      await this.checkUserInviteHasNotExpired(info);

      // TODO: can a banned user be invited to chatroom?
      const user = await this.getParticipant(info);
      if (user) {
        await this.checkUserHasNotAlreadyAcceptedInvite(user);
        await this.checkUserIsNotBanned(user);
      }

      await this.chatParticipantsService.createChatParticipant({
        userID: invite.invitedUser.id,
        chatRoomID: invite.chatRoom.id,
      });
      await this.inviteService.deleteInvitesByInvitedUserChatRoomID(info);
    } catch (e) {
      throw new ChatPermissionError(e.message);
    }
  }

  private async deleteChatRoom(info: UserChatInfo) {
    const chat = await this.chatsService.fetchChatByID(info.chatRoomID);
    if (!chat) {
      throw new ChatNotFoundError(
        `Chat room ${info.chatRoomID} cannot be deleted: does not exist.`,
      );
    }
    const user = await this.getParticipant(info);

    await this.checkUserIsOwner(user);
    await this.chatsService.deleteChatByID(chat.id);
  }
}
