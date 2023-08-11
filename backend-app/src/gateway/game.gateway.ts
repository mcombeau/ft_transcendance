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
import { GamesService } from 'src/games/games.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost'],
  },
})
export class GameGateway implements OnModuleInit {
  constructor(
    @Inject(forwardRef(() => ChatMessagesService))
    private chatMessagesService: ChatMessagesService,
    @Inject(forwardRef(() => ChatsService))
    private chatsService: ChatsService,
    @Inject(forwardRef(() => GamesService))
    private gameService: GamesService,
  ) {}
  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log(socket.id);
      console.log('[Game Gateway] A user connected');
      socket.on('disconnect', () => {
        console.log('[Game Gateway] A user disconnected');
      });
    });
  }

  @SubscribeMessage('tick')
  onTick(@MessageBody() state: any, @ConnectedSocket() socket: ioSocket) {
    socket.broadcast.emit('tick', state);
  }
}
