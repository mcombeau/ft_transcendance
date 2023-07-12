import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessageEntity } from 'src/typeorm/entities/chat-message.entity';
import { ChatGateway } from './chat.gateway';
import { ChatMessagesService } from 'src/chat-messages/chat-messages.service';
import { ChatsService } from 'src/chats/chats.service';
import { UsersService } from 'src/users/users.service';
import { ChatEntity } from 'src/typeorm/entities/chat.entity';
import { UserEntity } from 'src/typeorm/entities/user.entity';
import { GameGateway } from './game.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessageEntity, ChatEntity, UserEntity]),
  ],
  providers: [
    ChatGateway,
    ChatMessagesService,
    ChatsService,
    UsersService,
    GameGateway,
  ],
})
export class GatewayModule {}
