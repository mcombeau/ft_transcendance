import { OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { error } from 'console';
import { Server, Socket as ioSocket } from 'socket.io';
import { ChatMessagesService } from 'src/chat-messages/chat-messages.service';
import { ChatParticipantsService } from 'src/chat-participants/chat-participants.service';
import { ChatParticipantEntity } from 'src/chat-participants/entities/chat-participant.entity';
import { ChatsService } from 'src/chats/chats.service';
import { ChatEntity } from 'src/chats/entities/chat.entity';
import { ChatCreationError, ChatJoinError, ChatMuteError, ChatPermissionError } from 'src/exceptions/bad-request.interceptor';
import { UsersService } from 'src/users/users.service';

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

  @SubscribeMessage('add chat')
  async onAddChat(@MessageBody() info: any) {
    console.log('[Chat Gateway]: Add chat', info);
    try {
      await this.chatsService.createChat(info);
      this.server.emit('add chat', info);
    }
    catch (e) {
      console.log("[Chat Gateway]: Chat creation error:", e.message);
    }
  }

  @SubscribeMessage('dm')
  async onDM(@MessageBody() info: any) {
    try {
      var params = {
        name: `DM: ${info.current_user} / ${info.target_user}`,
        password: '',
        user1: info.current_user,
        user2: info.target_user,
      };
      this.chatsService.createChatDM(params);
      this.server.emit('dm', params);
    } catch (e) {
      console.log("[Chat Gateway]: DM creation error:", e.message);
    }
  }

  @SubscribeMessage('delete chat')
  async onDeleteChat(@MessageBody() info: any) {
    console.log('[Chat Gateway]: Delete chat', info);
    try {
      const chat = await this.chatsService.fetchChatByName(info);
      await this.chatsService.deleteChatByID(chat.id);
      this.server.emit('delete chat', info);
    }
    catch (e) {
      console.log("[Chat Gateway]: Chat deletion error:", e.message);
    }
  }

  @SubscribeMessage('join chat')
  async onJoinChat(@MessageBody() info: any) {
    console.log("[Chat Gateway]: Join chat", info);
    try {
      await this.addUserToChat(info.username, info.channel_name);
      this.server.emit('join chat', info);
    } catch (e) {
      console.log("[Chat Gateway]: Chat join error:", e.message);
    }
  }

  @SubscribeMessage('leave chat')
  async onLeaveChat(@MessageBody() info: any) {
    try {
      this.chatsService.removeParticipantFromChatByUsername(
        info.channel_name,
        info.username,
      );
      this.server.emit('leave chat', info);
    } catch (e) {
      console.log("[Chat Gateway]: Chat leave error:", e.message);
    }
  }

  @SubscribeMessage('chat message')
  async onChatMessage(
    @MessageBody() msg: any,
    @ConnectedSocket() socket: ioSocket,
  ) {
    var sender =
      await this.chatParticipantsService.fetchParticipantByUserChatNames(
        msg.sender,
        msg.channel,
      );
    if (
      !sender ||
      (await this.chatParticipantsService.userIsMuted(
        msg.channel,
        msg.sender,
      )) ||
      sender.banned
    ) {
      return;
    }
    this.server.emit('chat message', msg);
    this.chatMessagesService
      .createMessage(msg.msg, msg.sender, msg.channel, msg.datestamp)
      .catch((err: any) => {
        console.log(err);
      });
  }

  @SubscribeMessage('mute')
  async onMute(@MessageBody() info: any) {
    try {
      info.mute_date = await this.toggleMute(info.channel_name, info.current_user, info.target_user, info.lenght_in_minutes);
      this.server.emit('mute', info);
    }
    catch (e) {
      console.log("[Chat Gateway]: User mute error:", e.message);
    }
  }

  @SubscribeMessage('toggle private')
  async onTogglePrivate(@MessageBody() info: any) {
    console.log('[Chat Gateway]: Toggle private chat');
    var chat = await this.chatsService.fetchChatByName(info.channel_name);
    var id = chat.id;

    if (
      !this.chatParticipantsService.userIsOwner(info.channel_name, info.sender)
    ) {
      console.log('User is not owner');
      return;
    }

    this.chatsService.updateChatByID(id, {
      name: chat.name,
      private: !chat.private,
      password: chat.password,
      participantID: undefined,
    });
    this.server.emit('toggle private', info);
  }


  @SubscribeMessage('invite')
  async onInvite(@MessageBody() info: any) {
    // TODO: check status sender of invite
    try {
      var participant =
        await this.chatParticipantsService.fetchParticipantByUserChatNames(
          info.target_user,
          info.channel_name,
        );
      if (participant) {
        // If participant exists, then they were either invited or already part of channel,
        // so do nothing.
        var currentDate = new Date().getTime();
        if (
          !(await this.chatParticipantsService.userIsInvited(
            info.channel_name,
            info.target_user,
          ))
        ) {
          if (participant.invitedUntil === 0) {
            console.log(
              `[Chat Gateway]: User ${info.target_user} is already in channel and has already accepted invite.`,
            );
          } else if (participant.invitedUntil < currentDate) {
            console.log(
              `[Chat Gateway]: User ${info.target_user} invite has expired.`,
            );
          } else if (participant.invitedUntil > currentDate) {
            console.log(
              `[Chat Gateway]: User ${info.target_user} invite is pending.`,
            );
          }
        }
      } else if (!participant) {
        // If participant does not exist, then they aren't in channel or invited, so
        // create a new participant for them with an invite timestamp
        var inviteExpiryDate = new Date(
          Date.now() + 1 * (60 * 60 * 1000), // time + 1 hour
        ).getTime();
        var invitedParticipant =
          await this.chatsService.inviteParticipantToChatByUsername(
            info.channel_name,
            info.target_user,
            inviteExpiryDate,
          );
        console.log(`[Chat gateway]: invited participant`, invitedParticipant);
        info.mute_date = invitedParticipant.invitedUntil;
        this.server.emit('invite', info);
      }
    } catch (e) {
      console.log("[Chat Gateway]: Chat invite error:", e.message);
    }
  }

  @SubscribeMessage('accept invite')
  async onAcceptInvite(@MessageBody() info: any) {
    // TODO : deal with invited but banned
    try {
      var participant =
        await this.chatParticipantsService.fetchParticipantByUserChatNames(
          info.target_user,
          info.channel_name,
        );
      if (!participant) {
        // If participant does not exist, then there was no invitation to accept. Throw error?
        console.log(
          `[Chat Gateway]: Attempting to accept an invite that does not exist!`,
        );
        throw new error('Cannot accept an invite that was not sent!');
      } else if (participant) {
        // If participant exists, the participant was invited.
        if (
          this.chatParticipantsService.userIsInvited(
            info.channel_name,
            info.target_user,
          )
        ) {
          // if participant is currently invited (invite has not expired), set invited timestamp to 0
          // to indicate the invite was accepted
          await this.chatParticipantsService.updateParticipantByID(
            participant.id,
            {
              operator: participant.operator,
              owner: participant.owner,
              banned: participant.banned,
              mutedUntil: participant.mutedUntil,
              invitedUntil: 0,
            },
          );
          console.log(
            `[Chat gateway]: participant accepted invite`,
            participant,
          );
          info.invite_date = participant.invitedUntil;
          this.server.emit('accept invite', info);
        } else {
          // if participant is not currently invited and is trying to accept an invite, delete
          // participant from channel so participant can be invited again.
          await this.chatParticipantsService.deleteParticipantInChatByUsername(
            info.target_user,
            info.channel_name,
          );
          // TODO: Add a response containing error could not accept expired invite.
        }
      }
    } catch (e) {
      console.log("[Chat Gateway]: Chat accept invite error:", e.message);
    }
  }

  @SubscribeMessage('operator')
  async onMakeOperator(@MessageBody() info: any) {
    try {
      await this.toggleOperator(info.channel_name, info.current_user, info.target_user);
      this.server.emit('operator', info);
    }
    catch (e) {
      console.log("[Chat Gateway]: Operator promotion error:", e.message);
    }
  }

  @SubscribeMessage('ban')
  async onBan(@MessageBody() info: any) {
    try {
      await this.banUser(info.channel_name, info.current_user, info.target_user);
      this.server.emit('ban', info);
    }
    catch (e) {
      console.log("[Chat Gateway]: User ban error:", e.message);
    }
  }

  @SubscribeMessage('kick')
  async onKick(@MessageBody() info: any) {
    try {
      await this.kickUser(info.channel_name, info.current_user, info.target_user);
      this.server.emit('kick', info);
    }
    catch (e) {
      console.log("[Chat Gateway]: User kick error:", e.message);
    }
  }


  // --------------------  PERMISSION CHECKS




  private async getParticipant(chatRoomName: string, username: string) {
    const chatRoom = await this.chatsService.fetchChatByName(chatRoomName);
    if (! chatRoom) {
      throw new ChatPermissionError(`Chat '${chatRoomName} does not exist.`);
    }
    const userParticipant = await this.chatParticipantsService.fetchParticipantByUserChatNames(username, chatRoomName);
    if (!userParticipant) {
      throw new ChatPermissionError(`User '${username} is not in or invited to chat '${chatRoomName}`);
    }
    return userParticipant;
  }

  private async checkUserIsOwner(user: ChatParticipantEntity) {
    if (!user) {
      throw new ChatPermissionError(`Unexpected error during owner permission check: participant does not exist.`);
    }
    if (!user.owner) {
      throw new ChatPermissionError(`User '${user.participant.username}' is not owner of chat '${user.chatRoom.name}'.`);
    }
  }

  private async checkUserIsNotOwner(user: ChatParticipantEntity) {
    if (!user) {
      throw new ChatPermissionError(`Unexpected error during owner permission check: participant does not exist.`);
    }
    if (user.owner) {
      throw new ChatPermissionError(`User '${user.participant.username}' is owner of chat '${user.chatRoom.name}'.`);
    }
  }

  private async checkUserHasOperatorPermissions(user: ChatParticipantEntity) {
    if (!user) {
      throw new ChatPermissionError(`Unexpected error during operator permission check: participant does not exist.`);
    }
    if (!user.operator && !user.owner) {
      throw new ChatPermissionError(`User '${user.participant.username}' does not have operator privileges in chat '${user.chatRoom.name}'.`);
    }
  }

  private async checkUserIsNotOperator(user: ChatParticipantEntity) {
    if (!user) {
      throw new ChatPermissionError(`Unexpected error during operator permission check: participant does not exist.`);
    }
    if (user.operator || user.owner) {
      throw new ChatPermissionError(`User '${user.participant.username}' is operator of chat '${user.chatRoom.name}'.`);
    }
  }

  private async checkUserIsNotBanned(user: ChatParticipantEntity) {
    if (!user) {
      throw new ChatPermissionError(`Unexpected error during operator permission check: participant does not exist.`);
    }
    if (user.banned) {
      throw new ChatPermissionError(`User '${user.participant.username}' is banned from chat '${user.chatRoom.name}'.`);
    }
  }


  // -------------------- HANDLERS
  

  private async addUserToChat(username: string, chatRoomName: string) {
    const chatRoom = await this.chatsService.fetchChatByName(chatRoomName);
    const participant = await this.chatParticipantsService.fetchParticipantByUserChatNames(
      username,
      chatRoomName,
    );
    if (!chatRoom) {
      throw new ChatJoinError(`Chat '${chatRoomName}' does not exist.`);
    }
    if (chatRoom.private === true) {
      throw new ChatJoinError(`Chat '${chatRoomName}' is private.`);
    }
    if (participant && participant.invitedUntil === 0) {
      throw new ChatJoinError(`User '${username}' is already in chat '${chatRoomName}'.`);
    }
    if (participant && participant.banned) {
      throw new ChatJoinError(`User '${username}' is banned from chat '${chatRoomName}'.`);
    }
    this.chatsService.addParticipantToChatByUsername(
      chatRoomName,
      username,
    );
  }

  private async toggleMute(chatRoomName: string, username: string, targetUsername: string, minutes: number) {
    const user = await this.getParticipant(chatRoomName, username);
    const target = await this.getParticipant(chatRoomName, targetUsername);

    await this.checkUserHasOperatorPermissions(user);
    await this.checkUserIsNotOperator(target);
    await this.checkUserIsNotBanned(target);

    const isCurrentlyMuted = await this.chatParticipantsService.userIsMuted(
      chatRoomName,
      targetUsername,
      );
    if (isCurrentlyMuted) {
      var newMutedTimestamp = new Date().getTime();
    } else if (!isCurrentlyMuted) {
      newMutedTimestamp = new Date(
        Date.now() + minutes * (60 * 1000),
        ).getTime();
    }
    var participant_update = {
      operator: target.operator,
      banned: target.banned,
      owner: target.owner,
      mutedUntil: newMutedTimestamp,
      invitedUntil: target.invitedUntil,
    };
    await this.chatParticipantsService.updateParticipantByID(
      target.id,
      participant_update,
    );
    return (participant_update.mutedUntil);
  }

  private async toggleOperator(chatRoomName: string, username: string, targetUsername: string) {
    const user = await this.getParticipant(chatRoomName, username);
    const target = await this.getParticipant(chatRoomName, targetUsername);

    await this.checkUserIsOwner(user);
    await this.checkUserIsNotOwner(target);
    await this.checkUserIsNotBanned(target);
    
    this.chatParticipantsService.updateParticipantByID(target.id, {
      operator: !target.operator,
      banned: target.banned,
      owner: target.owner,
      mutedUntil: target.mutedUntil,
      invitedUntil: target.invitedUntil,
    });
  }

  private async banUser(chatRoomName: string, username: string, targetUsername: string) {
    const user = await this.getParticipant(chatRoomName, username);
    const target = await this.getParticipant(chatRoomName, targetUsername);

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
        invitedUntil: target.invitedUntil,
      });
    }
  }

  private async kickUser(chatRoomName: string, username: string, targetUsername: string) {
    const user = await this.getParticipant(chatRoomName, username);
    const target = await this.getParticipant(chatRoomName, targetUsername);

    await this.checkUserHasOperatorPermissions(user);
    await this.checkUserIsNotOwner(target);
    await this.checkUserIsNotBanned(target);

    this.chatParticipantsService.deleteParticipantInChatByUsername(
      target.participant.username,
      chatRoomName,
    );
  }
}