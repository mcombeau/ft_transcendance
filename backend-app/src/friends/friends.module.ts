import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendEntity } from 'src/friends/entities/friend.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FriendEntity])],
  controllers: [FriendsController],
  providers: [FriendsService],
})
export class FriendsModule {}
