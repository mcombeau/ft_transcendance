import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatEntity } from 'src/chats/entities/chat.entity';
import { UserNotFoundError } from 'src/exceptions/not-found.interceptor';
import { PasswordService } from 'src/password/password.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { createUserParams } from 'src/users/utils/types';
import { updateUserParams } from 'src/users/utils/types';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @Inject(forwardRef(() => PasswordService))
    private passwordService: PasswordService,
  ) {}

  fetchUsers() {
    return this.userRepository.find();
  }

  async createUser(userDetails: createUserParams) {
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

  fetchUserByID(id: number) {
    return this.userRepository.findOne({
      where: { id },
      relations: ['chatRooms.chatRoom'],
    });
  }

  fetchUserByUsername(username: string) {
    return this.userRepository.findOne({
      where: { username: username },
      relations: ['chatRooms.chatRoom'],
    });
  }

  async fetchUserBy42Login(login: string) {
    const user = await this.userRepository.findOne({
      where: { login42: login },
      relations: ['chatRooms.chatRoom'],
    });
    return user;
  }

  async fetchUserChatsByUserID(id: number) {
    // TODO: maybe transmit less user info
    const user = await this.userRepository
      .findOne({
        where: { id },
        relations: [
          'chatRooms.chatRoom',
          'chatRooms.chatRoom.participants',
          'chatRooms.chatRoom.participants.user',
        ],
      })
      .catch((e) => {
        console.log('[User Service]: ', e);
        throw new UserNotFoundError();
      });

    const userChatRooms: ChatEntity[] = [];
    for (const e of user.chatRooms) {
      userChatRooms.push(e.chatRoom);
    }
    console.log(userChatRooms);
    return userChatRooms;
  }

  async fetchUserChatDMsByUserID(id: number) {
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

  async getUserPasswordHash(userID: number) {
    const user = await this.userRepository.findOne({
      where: { id: userID },
      select: ['password'],
    });
    return user.password;
  }

  updateUserByID(id: number, userDetails: updateUserParams) {
    return this.userRepository.update({ id }, { ...userDetails });
  }

  deleteUserByID(id: number) {
    return this.userRepository.delete({ id });
  }
}
