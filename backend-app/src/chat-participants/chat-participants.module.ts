import { Module, forwardRef } from '@nestjs/common';
import { ChatParticipantsService } from './chat-participants.service';
import { ChatParticipantsController } from './chat-participants.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatParticipantEntity } from 'src/chat-participants/entities/chat-participant.entity';
import { ChatsModule } from 'src/chats/chats.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatParticipantEntity]),
    forwardRef(() => ChatsModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [ChatParticipantsController],
  providers: [ChatParticipantsService],
  exports: [ChatParticipantsService],
})
export class ChatParticipantsModule {}
