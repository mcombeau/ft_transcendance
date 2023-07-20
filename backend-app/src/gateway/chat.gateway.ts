import { OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket as ioSocket } from 'socket.io';
import { ChatMessagesService } from 'src/chat-messages/chat-messages.service';
import { ChatsService } from 'src/chats/chats.service';

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
  onChatMessage(@MessageBody() msg: any, @ConnectedSocket() socket: ioSocket) {
    socket.broadcast.emit('chat message', msg);
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
}
