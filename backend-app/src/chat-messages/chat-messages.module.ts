import { Module } from '@nestjs/common';
import { ChatMessagesController } from './chat-messages.controller';
import { ChatMessagesService } from './chat-messages.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessageEntity } from 'src/typeorm/entities/chat-message.entity';
import { ChatEntity } from 'src/typeorm/entities/chat.entity';
import { ChatsService } from 'src/chats/chats.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessageEntity, ChatEntity])],
  controllers: [ChatMessagesController],
  providers: [ChatMessagesService, ChatsService]
})
export class ChatMessagesModule {}
