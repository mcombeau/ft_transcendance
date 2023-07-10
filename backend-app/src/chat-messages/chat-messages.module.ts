import { Module } from '@nestjs/common';
import { ChatMessagesController } from './chat-messages.controller';
import { ChatMessagesService } from './chat-messages.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessageEntity } from 'src/typeorm/entities/chat-message.entity';
import { ChatEntity } from 'src/typeorm/entities/chat.entity';
import { ChatsService } from 'src/chats/chats.service';
import { UserEntity } from 'src/typeorm/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { ChatGateway } from 'src/gateway/chat.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessageEntity, ChatEntity, UserEntity]),
  ],
  controllers: [ChatMessagesController],
  providers: [ChatMessagesService, ChatsService, UsersService, ChatGateway],
})
export class ChatMessagesModule {}
