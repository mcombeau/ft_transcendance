import { Module, forwardRef } from '@nestjs/common';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendEntity } from 'src/friends/entities/Friend.entity';
import { UsersModule } from 'src/users/users.module';
import { BlockedUsersModule } from 'src/blocked-users/blockedUsers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FriendEntity]),
    forwardRef(() => UsersModule),
    forwardRef(() => BlockedUsersModule),
  ],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}
