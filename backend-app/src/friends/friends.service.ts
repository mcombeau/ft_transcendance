import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FriendEntity } from 'src/friends/entities/Friend.entity';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { createFriendParams, updateFriendParams } from './utils/types';
import { sendFriendDto } from './dtos/sendFriend.dto';
import { UsersService } from 'src/users/users.service';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(FriendEntity)
    private friendRepository: Repository<FriendEntity>,
    @Inject(forwardRef(() => UsersService))
    private userService: UsersService,
  ) {}

  private formatFriendForSending(friend: FriendEntity): sendFriendDto {
    const sendFriend: sendFriendDto = {
      userID1: friend.user1.id,
      username1: friend.user1.username,
      userID2: friend.user2.id,
      username2: friend.user2.username,
    };
    return sendFriend;
  }

  private formatFriendArrayForSending(
    friends: FriendEntity[],
  ): sendFriendDto[] {
    return friends.map(this.formatFriendForSending);
  }

  async fetchFriends(): Promise<sendFriendDto[]> {
    const friends = await this.friendRepository.find({
      relations: ['user1', 'user2'],
    });
    return this.formatFriendArrayForSending(friends);
  }

  async fetchFriendByID(id: number): Promise<sendFriendDto> {
    const friend = await this.friendRepository.findOne({
      where: { id },
      relations: ['user1', 'user2'],
    });
    return this.formatFriendForSending(friend);
  }

  async fetchFriendsByUserID(id: number): Promise<sendFriendDto[]> {
    const friends = await this.friendRepository.find({
      where: [{ user1: { id: id } }, { user2: { id: id } }],
      relations: ['user1', 'user2'],
    });
    return this.formatFriendArrayForSending(friends);
  }

  async fetchFriendEntityByUserIDs(
    userID1: number,
    userID2: number,
  ): Promise<FriendEntity> {
    const user1 = await this.userService.fetchUserByID(userID1);
    const user2 = await this.userService.fetchUserByID(userID2);
    if (!user1 || !user2) throw new BadRequestException('User not found');
    const foundRecord = await this.friendRepository.findOne({
      where: [
        {
          user1: { id: user1.id },
          user2: { id: user2.id },
        },
        {
          user1: { id: user2.id },
          user2: { id: user1.id },
        },
      ],
      relations: ['user1', 'user2'],
    });
    return foundRecord;
  }

  async fetchFriendByUserIDs(
    userID1: number,
    userID2: number,
  ): Promise<sendFriendDto> {
    return this.formatFriendForSending(
      await this.fetchFriendEntityByUserIDs(userID1, userID2),
    );
  }

  async createFriend(friendDetails: createFriendParams): Promise<FriendEntity> {
    if (friendDetails.userID1 === friendDetails.userID2)
      throw new BadRequestException('Cannot friend yourself !');
    const user1 = await this.userService.fetchUserByID(friendDetails.userID1);
    const user2 = await this.userService.fetchUserByID(friendDetails.userID2);
    if (!user1 || !user2) throw new BadRequestException('User not found');
    const foundRecord = await this.friendRepository.find({
      where: [
        {
          user1: { id: user1.id },
          user2: { id: user2.id },
        },
        {
          user1: { id: user2.id },
          user2: { id: user1.id },
        },
      ],
    });
    if (foundRecord.length > 0) {
      return foundRecord[0];
    }
    const newFriend = this.friendRepository.create({
      user1: user1,
      user2: user2,
    });
    return this.friendRepository.save(newFriend);
  }

  async updateFriendByID(
    id: number,
    friendDetails: updateFriendParams,
  ): Promise<UpdateResult> {
    const user1 = await this.userService.fetchUserByID(friendDetails.userID1);
    const user2 = await this.userService.fetchUserByID(friendDetails.userID2);

    return this.friendRepository.update({ id }, { user1: user1, user2: user2 });
  }

  async deleteFriendByID(id: number): Promise<DeleteResult> {
    return this.friendRepository.delete({ id });
  }

  async deleteFriendByUserIDs(
    friendDetails: updateFriendParams,
  ): Promise<DeleteResult> {
    const friend_relationship = await this.fetchFriendEntityByUserIDs(
      friendDetails.userID1,
      friendDetails.userID2,
    );
    if (friend_relationship)
      return this.deleteFriendByID(friend_relationship.id);
  }
}
