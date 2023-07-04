import { Module, ParseIntPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './typeorm/entities/user.entity';
import { UsersModule } from './users/users.module';
import { ChatsModule } from './chats/chats.module';
import { FriendsModule } from './friends/friends.module';
import { GamesModule } from './games/games.module';
import { ChatEntity } from './typeorm/entities/chat.entity';
import { FriendEntity } from './typeorm/entities/friend.entity';
import { GameEntity } from './typeorm/entities/game.entity';
import { ChatMessagesModule } from './chat-messages/chat-messages.module';
import { ChatMessageEntity } from './typeorm/entities/chat-message.entity';

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    entities: [UserEntity, ChatEntity, ChatMessageEntity, FriendEntity, GameEntity],
    synchronize: true,
  }), UsersModule, ChatsModule, ChatMessagesModule, FriendsModule, GamesModule, ChatMessagesModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
