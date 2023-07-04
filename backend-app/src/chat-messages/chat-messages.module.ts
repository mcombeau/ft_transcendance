import { Module } from '@nestjs/common';
import { ChatMessagesController } from './chat-messages.controller';
import { ChatMessagesService } from './chat-messages.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessageEntity } from 'src/typeorm/entities/chat-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessageEntity])],
  controllers: [ChatMessagesController],
  providers: [ChatMessagesService]
})
export class ChatMessagesModule {}
