import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { createReadStream, writeFile, unlink } from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatEntity } from 'src/chats/entities/chat.entity';
import { GameEntity } from 'src/games/entities/game.entity';
import { UserNotFoundError } from 'src/exceptions/not-found.interceptor';
import { PasswordService } from 'src/password/password.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { createUserParams } from 'src/users/utils/types';
import { updateUserParams } from 'src/users/utils/types';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { ChatsService } from 'src/chats/chats.service';
import { GamesService } from 'src/games/games.service';
import { FriendsService } from 'src/friends/friends.service';
import { BlockedUsersService } from 'src/blocked-users/blockedUsers.service';
import { sendParticipantDto } from 'src/chat-participants/dtos/sendChatParticipant.dto';
import { BadRequestException } from '@nestjs/common';
import { sendGameDto } from 'src/games/dtos/sendGame.dto';
import { sendFriendDto } from 'src/friends/dtos/sendFriend.dto';
import { sendBlockedUserDto } from 'src/blocked-users/dtos/sendBlockedUser.dto';
import { join, extname } from 'path';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @Inject(forwardRef(() => PasswordService))
    private passwordService: PasswordService,
    @Inject(forwardRef(() => ChatsService))
    private chatsService: ChatsService,
    @Inject(forwardRef(() => GamesService))
    private gameService: GamesService,
    @Inject(forwardRef(() => FriendsService))
    private friendService: FriendsService,
    @Inject(forwardRef(() => BlockedUsersService))
    private blockedUserService: BlockedUsersService,
  ) {}

  fetchUsers(): Promise<UserEntity[]> {
    return this.userRepository.find();
  }

  fetchUserByID(id: number): Promise<UserEntity> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  fetchUserByUsername(username: string): Promise<UserEntity> {
    return this.userRepository.findOne({
      where: { username: username },
    });
  }

  async fetchUserBy42Login(login: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { login42: login },
    });
    return user;
  }

  async fetchUserChatsByUserID(userID: number): Promise<ChatEntity[]> {
    const user = await this.userRepository.findOne({
      where: { id: userID },
      relations: ['chatRooms.chatRoom'],
    });
    if (!user || user === undefined || user === null) {
      throw new UserNotFoundError();
    }
    const userChatRooms: ChatEntity[] = [];
    for (const e of user.chatRooms) {
      const participants =
        await this.chatsService.fetchChatParticipantsByChatID(e.chatRoom.id);
      if (
        participants.some((user: sendParticipantDto) => {
          return user.userID === userID && !user.isBanned;
        })
      ) {
        userChatRooms.push(e.chatRoom);
      }
    }
    return userChatRooms;
  }

  async fetchUserGamesByUserID(userID: number): Promise<sendGameDto[]> {
    return this.gameService.fetchGamesByUserID(userID);
  }

  async fetchUserFriendsByUserID(userID: number): Promise<sendFriendDto[]> {
    return this.friendService.fetchFriendsByUserID(userID);
  }

  async fetchUserBlockedUsersByUserID(
    userID: number,
  ): Promise<sendBlockedUserDto[]> {
    return this.blockedUserService.fetchBlockedUsersByUserID(userID);
  }

  async fetchUserChatDMsByUserID(id: number): Promise<ChatEntity[]> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['chatRooms.chatRoom'],
    });
    const userDMRooms: ChatEntity[] = [];
    for (const e of user.chatRooms) {
      if (e.chatRoom.isDirectMessage === true) {
        userDMRooms.push(e.chatRoom);
      }
    }
    return userDMRooms;
  }

  async fetchUserAvatarByUserID(id: number) {
    const user = await this.fetchUserByID(id);

    const file = createReadStream(join(process.cwd(), user.avatarUrl));
    return file;
  }

  async createUser(userDetails: createUserParams): Promise<UserEntity> {
    const hashedPassword = await this.passwordService.hashPassword(
      userDetails.password,
    );
    userDetails.password = hashedPassword;
    const newUserInfo = this.userRepository.create({
      ...userDetails,
      isTwoFactorAuthenticationEnabled: false,
      twoFactorAuthenticationSecret: '',
      createdAt: new Date(),
      avatarUrl: '/user_data/defaultProfilePicture.jpg',
    });
    await this.userRepository.save(newUserInfo);
    return this.fetchUserByID(newUserInfo.id);
  }

  async getUserPasswordHash(userID: number): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userID },
      select: ['password'],
    });
    return user.password;
  }

  private async unlinkAvatar(filename: string) {
    await unlink(filename, (err) => {
      if (err) {
        console.log(
          '[User Service][Remove avatar] Failed to remove avatar...',
          filename,
        );
      } else {
        console.log(
          '[User Service][Remove avatar] Avatar removed successfully !',
          filename,
        );
      }
    });
  }

  private async deleteUserAvatarFileByID(id: number) {
    await this.unlinkAvatar(join(process.cwd(), 'user_data', id + '.png'));
    await this.unlinkAvatar(join(process.cwd(), 'user_data', id + '.jpg'));
    await this.unlinkAvatar(join(process.cwd(), 'user_data', id + '.jpeg'));
  }

  async removeUserAvatarByUserID(id: number) {
    await this.deleteUserAvatarFileByID(id);
    await this.updateUserByID(id, {
      avatarUrl: '/user_data/defaultProfilePicture.jpg',
    });
  }

  async saveUserAvatarByUserID(id: number, file: Express.Multer.File) {
    const user = await this.fetchUserByID(id);
    const filename = user.id + extname(file.originalname);
    const filepath = join(process.cwd(), 'user_data', filename);

    await writeFile(filepath, file.buffer, 'binary', (err) => {
      if (!err)
        console.log(
          '[User Service][Upload avatar] Avatar uploaded successfully !',
          filename,
          'at path',
          filepath,
        );
    });
    await this.updateUserByID(user.id, { avatarUrl: 'user_data/' + filename });
  }

  async updateUserByID(
    id: number,
    userDetails: updateUserParams,
  ): Promise<UpdateResult> {
    const updatedInfo: updateUserParams = {};
    if (userDetails.username) updatedInfo.username = userDetails.username;
    if (userDetails.email) updatedInfo.email = userDetails.email;
    if (userDetails.avatarUrl) updatedInfo.avatarUrl = userDetails.avatarUrl;
    if (userDetails.status) {
      console.log(
        '[User Service]: updating user',
        id,
        'status to ',
        userDetails.status,
      );
      updatedInfo.status = userDetails.status;
    }

    if (userDetails.currentPassword) {
      const user = await this.fetchUserByID(id);
      const isValidCurrentPassword = await this.passwordService.checkPassword(
        userDetails.currentPassword,
        user,
      );
      if (isValidCurrentPassword) {
        const hashedPassword = await this.passwordService.hashPassword(
          userDetails.newPassword,
        );
        updatedInfo.password = hashedPassword;
      } else {
        throw new BadRequestException('Invalid password');
      }
    }
    return this.userRepository.update({ id }, { ...updatedInfo });
  }

  async setTwoFactorAuthenticationSecret(secret: string, id: number) {
    return this.userRepository.update(
      { id },
      { twoFactorAuthenticationSecret: secret },
    );
  }

  async setTwoFactorAuthentication(username: string, state: boolean) {
    const user = await this.fetchUserByUsername(username);
    await this.userRepository.update(
      { id: user.id },
      { isTwoFactorAuthenticationEnabled: state },
    );
  }

  deleteUserByID(id: number): Promise<DeleteResult> {
    return this.userRepository.delete({ id });
  }
}
