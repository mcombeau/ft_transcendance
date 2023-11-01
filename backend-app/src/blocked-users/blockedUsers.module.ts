import { Module, forwardRef } from '@nestjs/common';
import { BlockedUsersController } from './blockedUsers.controller';
import { BlockedUsersService } from './blockedUsers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockedUserEntity } from 'src/blocked-users/entities/BlockedUser.entity';
import { UsersModule } from 'src/users/users.module';
import { FriendsModule } from 'src/friends/friends.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlockedUserEntity]),
    forwardRef(() => UsersModule),
    forwardRef(() => FriendsModule),
  ],
  controllers: [BlockedUsersController],
  providers: [BlockedUsersService],
  exports: [BlockedUsersService],
})
export class BlockedUsersModule {}
