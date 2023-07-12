import { Module } from '@nestjs/common';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatEntity } from 'src/typeorm/entities/chat.entity';
import { ChatMessagesService } from 'src/chat-messages/chat-messages.service';
import { ChatMessageEntity } from 'src/typeorm/entities/chat-message.entity';
import { UsersService } from 'src/users/users.service';
import { UserEntity } from 'src/typeorm/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatEntity, ChatMessageEntity, UserEntity])],
  controllers: [ChatsController],
  providers: [ChatsService, ChatMessagesService, UsersService]
})
export class ChatsModule {}