import { OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { createChatMessageParams } from 'src/chat-messages/utils/types';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket as ioSocket } from 'socket.io';
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
import { InviteEntity } from 'src/invites/entities/Invite.entity';
import { InvitesService } from 'src/invites/invites.service';
import { UsersService } from 'src/users/users.service';
import { UserChatInfo } from 'src/chat-participants/utils/types';

type UserTargetChat = {
  userID: number;
  targetID: number;
  chatRoomID: number;
};

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
  async onAddChat(@MessageBody() info: any) {
    console.log('[Chat Gateway]: Add chat', info);
    try {
      var sender = await this.checkIdentity(info.token);
      await this.chatsService.createChat(info);
      this.server.emit('add chat', info);
    } catch (e) {
      var err_msg = '[Chat Gateway]: Chat creation error:' + e.message;
      console.log(err_msg);
      this.server.emit('error', err_msg);
    }
  }

  @SubscribeMessage('dm')
  async onDM(@MessageBody() info: any) {
    try {
      var sender = await this.checkIdentity(info.token);
      // TODO: move that logic to the dm creation service
      if (info.current_user < info.target_user) {
        var name = `DM: ${info.current_user} / ${info.target_user}`;
      } else {
        name = `DM: ${info.target_user} / ${info.current_user}`;
      }
      var params = {
        name: name,
        password: '',
        user1: info.current_user,
        user2: info.target_user,
      };
      await this.chatsService.createChatDM(params); // TODO : see what happens if already exists
      console.log('Created dm !!!!!!!!!!!!');
      this.server.emit('dm', params);
    } catch (e) {
      var err_msg = '[Chat Gateway]: DM creation error:' + e.message;
      console.log(err_msg);
      this.server.emit('error', err_msg);
    }
  }

  @SubscribeMessage('delete chat')
  async onDeleteChat(@MessageBody() info: any) {
    console.log('[Chat Gateway]: Delete chat', info);
    try {
      var sender = await this.checkIdentity(info.token);
      const chat = await this.chatsService.fetchChatByName(info.channel_name);
      await this.chatsService.deleteChatByID(chat.id);
      this.server.emit('delete chat', info.channel_name);
    } catch (e) {
      var err_msg = '[Chat Gateway]: Chat deletion error:' + e.message;
      console.log(err_msg);
      this.server.emit('error', err_msg);
    }
  }

  @SubscribeMessage('join chat')
  async onJoinChat(@MessageBody() info: any) {
    console.log('[Chat Gateway]: Join chat', info);
    try {
      var sender = await this.checkIdentity(info.token);
      await this.addUserToChat(info.username, info.channel_name);
      this.server.emit('join chat', info);
    } catch (e) {
      var err_msg = '[Chat Gateway]: Chat join error:' + e.message;
      console.log(err_msg);
      this.server.emit('error', err_msg);
    }
  }

  @SubscribeMessage('leave chat')
  async onLeaveChat(@MessageBody() info: any) {
    try {
      var sender = await this.checkIdentity(info.token);
      await this.chatsService.removeParticipantFromChatByUsername(
        info.channel_name,
        info.username,
      );
      this.server.emit('leave chat', info);
    } catch (e) {
      var err_msg = '[Chat Gateway]: Chat leave error:' + e.message;
      console.log(err_msg);
      this.server.emit(err_msg);
    }
  }

  @SubscribeMessage('chat message')
  async onChatMessage(@MessageBody() msg: any) {
    console.log('[Chat Gateway]: Sending chat message');
    try {
      var sender = await this.checkIdentity(msg.token);
      await this.registerChatMessage(
        msg.msg.channel,
        msg.msg.sender,
        msg.msg.msg,
        msg.msg.datestamp,
      );
      this.server.emit('chat message', msg.msg);
    } catch (e) {
      var err_msg =
        '[Chat Gateway]: Chat message registration error:' + e.message;
      console.log(err_msg);
      this.server.emit(err_msg);
    }
  }

  @SubscribeMessage('mute')
  async onMute(@MessageBody() info: any) {
    try {
      var sender = await this.checkIdentity(info.token);
      info.mute_date = await this.toggleMute(
        info.channel_name,
        info.current_user,
        info.target_user,
        info.lenght_in_minutes,
      );
      this.server.emit('mute', info);
    } catch (e) {
      var err_msg = '[Chat Gateway]: User mute error:' + e.message;
      console.log(err_msg);
      this.server.emit(err_msg);
    }
  }

  @SubscribeMessage('toggle private')
  async onTogglePrivate(@MessageBody() info: any) {
    console.log('[Chat Gateway]: Toggle private chat');
    try {
      var sender = await this.checkIdentity(info.token);
      await this.toggleChatPrivacy(info.channel_name, info.sender);
      this.server.emit('toggle private', info);
    } catch (e) {
      var err_msg = '[Chat Gateway]: Chat privacy toggle error:' + e.message;
      console.log(err_msg);
      this.server.emit(err_msg);
    }
  }

  @SubscribeMessage('invite')
  async onInvite(@MessageBody() info: any) {
    try {
      var sender = await this.checkIdentity(info.token);
      var inviteExpiry = await this.inviteUser(
        info.channel_name,
        info.current_user,
        info.target_user,
      );
      info.inviteDate = inviteExpiry;
      this.server.emit('invite', info);
    } catch (e) {
      var err_msg = '[Chat Gateway]: Chat invite error:' + e.message;
      console.log(err_msg);
      this.server.emit(err_msg);
    }
  }

  @SubscribeMessage('accept invite')
  async onAcceptInvite(@MessageBody() info: any) {
    try {
      var sender = await this.checkIdentity(info.token);
      await this.acceptUserInvite(info.channel_name, info.target_user);
      info.invite_date = 0;
      this.server.emit('accept invite', info);
    } catch (e) {
      var err_msg = '[Chat Gateway]: Chat accept invite error:' + e.message;
      console.log(err_msg);
      this.server.emit(err_msg);
    }
  }

  @SubscribeMessage('operator')
  async onMakeOperator(@MessageBody() info: any) {
    try {
      var sender = await this.checkIdentity(info.token);
      await this.toggleOperator(
        info.channel_name,
        info.current_user,
        info.target_user,
      );
      this.server.emit('operator', info);
    } catch (e) {
      console.log('[Chat Gateway]: Operator promotion error:', e.message);
    }
  }

  @SubscribeMessage('ban')
  async onBan(@MessageBody() info: any) {
    try {
      var sender = await this.checkIdentity(info.token);
      await this.banUser(
        info.channel_name,
        info.current_user,
        info.target_user,
      );
      this.server.emit('ban', info);
    } catch (e) {
      var err_msg = '[Chat Gateway]: User ban error:' + e.message;
      console.log(err_msg);
      this.server.emit(err_msg);
    }
  }

  @SubscribeMessage('kick')
  async onKick(@MessageBody() info: any) {
    try {
      var sender = await this.checkIdentity(info.token);
      await this.kickUser(
        info.channel_name,
        info.current_user,
        info.target_user,
      );
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
      await this.chatParticipantsService.fetchParticipantByUserChatIDs(
        info.userID,
        info.chatRoomID,
      );
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
        `User '${user.participant.username}' is not owner of chat '${user.chatRoom.name}'.`,
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
        `User '${user.participant.username}' is owner of chat '${user.chatRoom.name}'.`,
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
        `User '${user.participant.username}' does not have operator privileges in chat '${user.chatRoom.name}'.`,
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
        `User '${user.participant.username}' is operator of chat '${user.chatRoom.name}'.`,
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
        `User '${user.participant.username}' is banned from chat '${user.chatRoom.name}'.`,
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
        `User '${user.participant.username}' is muted in chat '${user.chatRoom.name}'.`,
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
      info.userID,
      info.chatRoomID,
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
        `User '${user.participant.username}' has already accepted invite to chat '${user.chatRoom.name}'.`,
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
    if (chatRoom.private === true) {
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
    const user = await this.getParticipant({
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
    var participant_update = {
      operator: target.operator,
      banned: target.banned,
      owner: target.owner,
      mutedUntil: newMutedTimestamp,
    };
    await this.chatParticipantsService.updateParticipantByID(
      target.id,
      participant_update,
    );
    return participant_update.mutedUntil;
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
      banned: target.banned,
      owner: target.owner,
      mutedUntil: target.mutedUntil,
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
        operator: target.operator,
        banned: true,
        owner: target.owner,
        mutedUntil: target.mutedUntil,
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

    await this.checkUserIsOwner(user);

    this.chatsService.updateChatByID(chatRoom.id, {
      name: chatRoom.name,
      private: !chatRoom.private,
      password: chatRoom.password,
      participantID: undefined,
    });
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
        `${target.participant.id} cannot be invited: already in chat room ${info.chatRoomID}`,
      );
    }
    const invite = await this.inviteService.createInvite({
      type: 'chat',
      senderUserID: info.userID,
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

      await this.chatParticipantsService.createChatParticipant(
        invite.invitedUser.id,
        invite.chatRoom.id,
        invite.expiresAt,
      );
      await this.inviteService.deleteInvitesByInvitedUserChatRoomID(info);
    } catch (e) {
      throw new ChatPermissionError(e.message);
    }
  }
}
