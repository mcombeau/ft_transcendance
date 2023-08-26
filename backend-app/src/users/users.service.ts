import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatEntity } from 'src/chats/entities/chat.entity';
import { UserNotFoundError } from 'src/exceptions/not-found.interceptor';
import { PasswordService } from 'src/password/password.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { createUserParams } from 'src/users/utils/types';
import { updateUserParams } from 'src/users/utils/types';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @Inject(forwardRef(() => PasswordService))
    private passwordService: PasswordService,
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

  async fetchUserChatsByUserID(id: number): Promise<ChatEntity[]> {
    const user = await this.userRepository
      .findOne({
        where: { id },
        relations: ['chatRooms.chatRoom'],
      })
      .catch((e) => {
        console.log('[User Service]: ', e);
        throw new UserNotFoundError();
      });

    const userChatRooms: ChatEntity[] = [];
    for (const e of user.chatRooms) {
      userChatRooms.push(e.chatRoom);
    }
    return userChatRooms;
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

  async createUser(userDetails: createUserParams): Promise<UserEntity> {
    const hashedPassword = await this.passwordService.hashPassword(
      userDetails.password,
    );
    userDetails.password = hashedPassword;
    console.log('[User Service]: creating user', userDetails);
    const newUser = this.userRepository.create({
      ...userDetails,
      createdAt: new Date(),
    });
    return this.userRepository.save(newUser);
  }

  async getUserPasswordHash(userID: number): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userID },
      select: ['password'],
    });
    return user.password;
  }

  updateUserByID(
    id: number,
    userDetails: updateUserParams,
  ): Promise<UpdateResult> {
    return this.userRepository.update({ id }, { ...userDetails });
  }

  deleteUserByID(id: number): Promise<DeleteResult> {
    return this.userRepository.delete({ id });
  }
}
