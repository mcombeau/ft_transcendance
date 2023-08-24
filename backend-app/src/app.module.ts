import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';
import { ChatsModule } from './chats/chats.module';
import { FriendsModule } from './friends/friends.module';
import { GamesModule } from './games/games.module';
import { ChatEntity } from './chats/entities/chat.entity';
import { FriendEntity } from './friends/entities/friend.entity';
import { GameEntity } from './games/entities/game.entity';
// import { ChatMessagesModule } from './chat-messages/chat-messages.module';
import { ChatMessageEntity } from './chat-messages/entities/chat-message.entity';
import { GatewayModule } from './gateway/gateway.module';
import { AuthModule } from './auth/auth.module';
import { ChatMessagesModule } from './chat-messages/chat-messages.module';
import { ChatParticipantEntity } from './chat-participants/entities/chat-participant.entity';
import { ChatParticipantsModule } from './chat-participants/chat-participants.module';
import { InviteEntity } from './invites/entities/Invite.entity';
import { InvitesModule } from './invites/invites.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [
        UserEntity,
        ChatEntity,
        ChatMessageEntity,
        ChatParticipantEntity,
        FriendEntity,
        GameEntity,
        InviteEntity,
      ],
      synchronize: true,
    }),
    UsersModule,
    ChatsModule,
    FriendsModule,
    GamesModule,
    GatewayModule,
    AuthModule,
    ChatMessagesModule,
    ChatParticipantsModule,
    InvitesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
