import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BlockedUserEntity } from 'src/blocked-users/entities/BlockedUser.entity';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import {
  createBlockedUserParams,
  updateBlockedUserParams,
} from './utils/types';
import { sendBlockedUserDto } from './dtos/sendBlockedUser.dto';
import { UsersService } from 'src/users/users.service';
import { BadRequestException } from '@nestjs/common';
import { FriendsService } from 'src/friends/friends.service';

@Injectable()
export class BlockedUsersService {
  constructor(
    @InjectRepository(BlockedUserEntity)
    private blockedUserRepository: Repository<BlockedUserEntity>,
    @Inject(forwardRef(() => UsersService))
    private userService: UsersService,
    @Inject(forwardRef(() => FriendsService))
    private friendService: FriendsService,
  ) {}

  private formatBlockedUserForSending(
    blockedUser: BlockedUserEntity,
  ): sendBlockedUserDto {
    const sendBlockedUser: sendBlockedUserDto = {
      blockingUserID: blockedUser.blockingUser.id,
      blockingUsername: blockedUser.blockingUser.username,
      blockingUserStatus: blockedUser.blockingUser.status,
      blockedUserID: blockedUser.blockedUser.id,
      blockedUsername: blockedUser.blockedUser.username,
      blockedUserStatus: blockedUser.blockedUser.status,
    };
    return sendBlockedUser;
  }

  private formatBlockedUserArrayForSending(
    blockedUsers: BlockedUserEntity[],
  ): sendBlockedUserDto[] {
    return blockedUsers.map(this.formatBlockedUserForSending);
  }

  async fetchBlockedUsers(): Promise<sendBlockedUserDto[]> {
    const blockedUsers = await this.blockedUserRepository.find({
      relations: ['blockingUser', 'blockedUser'],
    });
    return this.formatBlockedUserArrayForSending(blockedUsers);
  }

  async fetchBlockedUserByID(id: number): Promise<sendBlockedUserDto> {
    const blockedUser = await this.blockedUserRepository.findOne({
      where: { id },
      relations: ['blockingUser', 'blockedUser'],
    });
    return this.formatBlockedUserForSending(blockedUser);
  }

  async fetchBlockedUsersByUserID(
    userID: number,
  ): Promise<sendBlockedUserDto[]> {
    const usersIAmBlocking = await this.blockedUserRepository.find({
      where: [{ blockingUser: { id: userID } }],
      relations: ['blockingUser', 'blockedUser'],
    });
    return this.formatBlockedUserArrayForSending(usersIAmBlocking);
  }

  async fetchBlockingUsersByUserID(
    userID: number,
  ): Promise<sendBlockedUserDto[]> {
    const usersBlockingMe = await this.blockedUserRepository.find({
      where: [{ blockedUser: { id: userID } }],
      relations: ['blockingUser', 'blockedUser'],
    });
    return this.formatBlockedUserArrayForSending(usersBlockingMe);
  }

  async usersAreBlockingEachOtherByUserIDs(
    userID1: number,
    userID2: number,
  ): Promise<boolean> {
    const foundRecord = await this.blockedUserRepository.find({
      where: [
        {
          blockingUser: { id: userID1 },
          blockedUser: { id: userID2 },
        },
        {
          blockingUser: { id: userID2 },
          blockedUser: { id: userID1 },
        },
      ],
      relations: ['blockingUser', 'blockedUser'],
    });
    return foundRecord.length > 0;
  }

  async fetchBlockedUserEntityByUserIDs(
    blockingUserID: number,
    blockedUserID: number,
  ): Promise<BlockedUserEntity> {
    const blockingUser = await this.userService.fetchUserByID(blockingUserID);
    const blockedUser = await this.userService.fetchUserByID(blockedUserID);
    if (!blockingUser || !blockedUser)
      throw new BadRequestException('User not found');
    const foundRecord = await this.blockedUserRepository.findOne({
      where: [
        {
          blockingUser: { id: blockingUser.id },
          blockedUser: { id: blockedUser.id },
        },
      ],
      relations: ['blockingUser', 'blockedUser'],
    });
    return foundRecord;
  }

  async fetchBlockedUserByUserIDs(
    blockingUserID: number,
    blockedUserID: number,
  ): Promise<sendBlockedUserDto> {
    const blockedUserEntity = await this.fetchBlockedUserEntityByUserIDs(
      blockingUserID,
      blockedUserID,
    );
    if (!blockedUserEntity) {
      throw new BadRequestException('Could not find blockedUser relation');
    }
    return this.formatBlockedUserForSending(blockedUserEntity);
  }

  async createBlockedUser(
    blockedUserDetails: createBlockedUserParams,
  ): Promise<BlockedUserEntity> {
    if (blockedUserDetails.blockingUserID === blockedUserDetails.blockedUserID)
      throw new BadRequestException('Cannot blocked yourself !');
    const blockingUser = await this.userService.fetchUserByID(
      blockedUserDetails.blockingUserID,
    );
    const blockedUser = await this.userService.fetchUserByID(
      blockedUserDetails.blockedUserID,
    );
    if (!blockingUser || !blockedUser)
      throw new BadRequestException('User not found');
    const foundRecord = await this.blockedUserRepository.find({
      where: [
        {
          blockingUser: { id: blockingUser.id },
          blockedUser: { id: blockedUser.id },
        },
      ],
    });
    if (foundRecord.length > 0) {
      return foundRecord[0];
    }
    const newBlockedUser = this.blockedUserRepository.create({
      blockingUser: blockingUser,
      blockedUser: blockedUser,
    });
    try {
      await this.friendService.deleteFriendByUserIDs({
        userID1: blockingUser.id,
        userID2: blockedUser.id,
      });
    } catch (e) {
      console.log('[BlockedUser service] Caught error');
    }
    return this.blockedUserRepository.save(newBlockedUser);
  }

  async deleteBlockedUserByID(id: number): Promise<DeleteResult> {
    return this.blockedUserRepository.delete({ id });
  }

  async deleteBlockedUserByUserIDs(
    blockedUserDetails: updateBlockedUserParams,
  ): Promise<DeleteResult> {
    const blockedUserRelationship = await this.fetchBlockedUserEntityByUserIDs(
      blockedUserDetails.blockingUserID,
      blockedUserDetails.blockedUserID,
    );
    if (blockedUserRelationship)
      return this.deleteBlockedUserByID(blockedUserRelationship.id);
  }
}
