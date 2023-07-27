import { OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { error } from 'console';
import { partition } from 'rxjs';
import { Server, Socket as ioSocket } from 'socket.io';
import { ChatMessagesService } from 'src/chat-messages/chat-messages.service';
import { ChatParticipantsService } from 'src/chat-participants/chat-participants.service';
import { ChatsService } from 'src/chats/chats.service';
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
    private userService: UsersService
  ) {}
  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log(socket.id);

      console.log('A user connected');

      socket.broadcast.emit('connection event');
      socket.on('disconnect', () => {
        console.log('a user disconnected');
        socket.broadcast.emit('disconnection event');
      });
    });
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

  @SubscribeMessage('delete chat')
  async onDeleteChat(@MessageBody() info: any) {
    var entity = await this.chatsService.fetchChatByName(info);
    var id = entity.id;

    this.chatsService.deleteChatByID(id).catch((err: any) => {
      console.log(err);
    });
    this.server.emit('delete chat', info);
  }

  @SubscribeMessage('add chat')
  async onAddChat(@MessageBody() info: any) {
    this.chatsService.createChat(info);
    this.server.emit('add chat', info);
  }

  @SubscribeMessage('join chat')
  async onJoinChat(@MessageBody() info: any) {
    console.log('Someone trying to join');
    try {
      if (
        await this.chatParticipantsService.fetchParticipantByUserChatNames(
          info.username,
          info.channel_name,
        ) // TODO: check if you are banned you can't get any info
      ) {
        return;
      }
      console.log('Actually joining');
      this.chatsService.addParticipantToChatByUsername(
        info.channel_name,
        info.username,
      );
      this.server.emit('join chat', info);
    } catch (e) {
      console.log('Chat join Error');
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
      console.log('Chat leave Error');
    }
  }

  @SubscribeMessage('mute')
  async onMute(@MessageBody() info: any) {
    try {
      if (
        !this.chatParticipantsService.userIsOperator(
          info.channel_name,
          info.current_user,
        )
      ) {
        console.log("This user is not operator. They can't mute other users.");
      } else {
        var participant =
          await this.chatParticipantsService.fetchParticipantByUserChatNames(
            info.target_user,
            info.channel_name,
          );

        if (participant.owner) {
          console.log("Can't mute the chat owner.");
        } else if (participant.banned) {
          console.log("Can't mute someone who is already banned.");
        } else {
          var isCurrentlyMuted = await this.chatParticipantsService.userIsMuted(
            info.channel_name,
            info.target_user,
          );
          if (isCurrentlyMuted) {
            var newMutedTimestamp = new Date().getTime();
          } else if (!isCurrentlyMuted) {
            newMutedTimestamp = new Date(
              Date.now() + info.lenght_in_minutes * (60 * 1000),
            ).getTime();
          }
          var participant_update = {
            operator: participant.operator,
            banned: participant.banned,
            owner: participant.owner,
            mutedUntil: newMutedTimestamp,
            invitedUntil: participant.invitedUntil
          };
          console.log(`[Chat gateway]: Toggling mute `, participant_update);
          await this.chatParticipantsService.updateParticipantByID(
            participant.id,
            participant_update,
          );
          info.mute_date = participant_update.mutedUntil;
          this.server.emit('mute', info);
          console.log('Toggled mute ' + info.target_user);
          console.log(new Date(participant_update.mutedUntil));
        }
      }
    } catch (e) {
      console.log('Mute Error');
      console.log(e);
    }
  }

  @SubscribeMessage('invite')
  async onInvite(@MessageBody() info: any) {
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
          if (!await this.chatParticipantsService.userIsInvited(info.channel_name, info.target_user)) {
            if (participant.invitedUntil === 0) {
              console.log(`[Chat Gateway]: User ${info.target_user} is already in channel and has already accepted invite.`);
            }
            else if (participant.invitedUntil < currentDate) {
              console.log(`[Chat Gateway]: User ${info.target_user} invite has expired.`);
            }
            else if (participant.invitedUntil > currentDate) {
              console.log(`[Chat Gateway]: User ${info.target_user} invite is pending.`);
            }
          }
        }
        else if (!participant) {
          // If participant does not exist, then they aren't in channel or invited, so
          // create a new participant for them with an invite timestamp
          var inviteExpiryDate = new Date(
            Date.now() + 1 * (60 * 60 * 1000), // time + 1 hour
          ).getTime();
          var invitedParticipant = await this.chatsService.inviteParticipantToChatByUsername(
            info.channel_name,
            info.target_user,
            inviteExpiryDate
          );
          console.log(`[Chat gateway]: invited participant`, invitedParticipant);
          info.mute_date = invitedParticipant.invitedUntil;
          this.server.emit('invite', info);
        }
      } catch (e) {
      console.log('Invite Error');
      console.log(e);
    }
  }

  @SubscribeMessage('accept invite')
  async onAcceptInvite(@MessageBody() info: any) {
    try {
      var participant =
        await this.chatParticipantsService.fetchParticipantByUserChatNames(
          info.target_user,
          info.channel_name,
        );
        if (!participant) {
          // If participant does not exist, then there was no invitation to accept. Throw error?
          console.log(`[Chat Gateway]: Attempting to accept an invite that does not exist!`);
          throw new error('Cannot accept an invite that was not sent!');
        }
        else if (participant) {
          // If participant exists, the participant was invited.
          if (this.chatParticipantsService.userIsInvited(info.channel_name, info.target_user)) {
            // if participant is currently invited (invite has not expired), set invited timestamp to 0
            // to indicate the invite was accepted
            await this.chatParticipantsService.updateParticipantByID(participant.id, {
              operator: participant.operator,
              owner: participant.owner,
              banned: participant.banned,
              mutedUntil: participant.mutedUntil,
              invitedUntil: 0,
            });
            console.log(`[Chat gateway]: participant accepted invite`, participant);
            info.invite_date = participant.invitedUntil;
            this.server.emit('invite', info);
          }
          else {
            // if participant is not currently invited and is trying to accept an invite, delete
            // participant from channel so participant can be invited again.
            await this.chatParticipantsService.deleteParticipantInChatByUsername(info.target_user, info.channel_name);
            // TODO: Add a response containing error could not accept expired invite.
          }
        }
      } catch (e) {
      console.log('Invite Error');
      console.log(e);
    }
  }

  @SubscribeMessage('operator')
  async onMakeOperator(@MessageBody() info: any) {
    try {
      if (
        !this.chatParticipantsService.userIsOwner(
          info.channel_name,
          info.current_user,
        )
      ) {
        console.log(
          "This user is not owner. They can't make other users operator.",
        );
      } else {
        var participant =
          await this.chatParticipantsService.fetchParticipantByUserChatNames(
            info.target_user,
            info.channel_name,
          );

        if (participant.owner) {
          console.log('The chan owner is always operator.');
        } else if (participant.banned) {
          console.log("Can't make operator someone who is already banned.");
        } else {
          this.chatParticipantsService.updateParticipantByID(participant.id, {
            operator: !participant.operator,
            banned: participant.banned,
            owner: participant.owner,
            mutedUntil: participant.mutedUntil,
            invitedUntil: participant.invitedUntil
          });
          this.server.emit('operator', info);
        }
      }
    } catch (e) {
      console.log('Operator making Error');
      console.log(e);
    }
  }

  @SubscribeMessage('ban')
  async onBan(@MessageBody() info: any) {
    try {
      if (
        !this.chatParticipantsService.userIsOperator(
          info.channel_name,
          info.current_user,
        )
      ) {
        console.log("This user is not operator. They can't ban other users.");
      } else {
        var participant =
          await this.chatParticipantsService.fetchParticipantByUserChatNames(
            info.target_user,
            info.channel_name,
          );

        if (participant.owner) {
          console.log("Can't ban the chat owner.");
        } else {
          if (participant.banned) {
            this.chatParticipantsService.deleteParticipantByID(participant.id);
          } else {
            this.chatParticipantsService.updateParticipantByID(participant.id, {
              operator: participant.operator,
              banned: true,
              owner: participant.owner,
              mutedUntil: participant.mutedUntil,
              invitedUntil: participant.invitedUntil
            });
          }
          this.server.emit('ban', info);
        }
      }
    } catch (e) {
      console.log('Ban Error');
      console.log(e);
    }
  }

  @SubscribeMessage('kick')
  async onKick(@MessageBody() info: any) {
    try {
      if (
        !this.chatParticipantsService.userIsOperator(
          info.channel_name,
          info.current_user,
        )
      ) {
        console.log("This user is not operator. They can't kick other users.");
      } else {
        var participant =
          await this.chatParticipantsService.fetchParticipantByUserChatNames(
            info.target_user,
            info.channel_name,
          );
        if (participant.owner) {
          console.log("Can't kick the chat owner.");
        } else if (participant.banned) {
          console.log("Can't kick someone who is already banned.");
        } else {
          this.chatParticipantsService.deleteParticipantInChatByUsername(
            info.target_user,
            info.channel_name,
          );
          this.server.emit('kick', info);
        }
      }
    } catch (e) {
      console.log('Kick Error');
      console.log(e);
    }
  }
}
