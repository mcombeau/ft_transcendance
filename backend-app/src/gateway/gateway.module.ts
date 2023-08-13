import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { GameGateway } from './game.gateway';
import { ChatMessagesModule } from 'src/chat-messages/chat-messages.module';
import { ChatsModule } from 'src/chats/chats.module';
import { UsersModule } from 'src/users/users.module';
import { GamesModule } from 'src/games/games.module';
import { ChatParticipantsModule } from 'src/chat-participants/chat-participants.module';

@Module({
  imports: [
    forwardRef(() => ChatsModule),
    forwardRef(() => ChatMessagesModule),
    forwardRef(() => UsersModule),
    forwardRef(() => ChatParticipantsModule),
    forwardRef(() => GamesModule)
  ],
  providers: [ChatGateway, GameGateway],
  exports: [ChatGateway, GameGateway],
})
export class GatewayModule {}
