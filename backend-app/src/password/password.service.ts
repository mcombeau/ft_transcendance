import { Inject, Injectable, forwardRef } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserEntity } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class PasswordService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private userService: UsersService,
  ) {}

  async hashPassword(password: string) {
    if (!password || password === '') {
      return password;
    }
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);
    return hash;
  }

  async checkPassword(password: string, user: UserEntity) {
    const hash = await this.userService.getUserPasswordHash(user.id);
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  }

  // public async checkPasswordForChatByName(password: string, chatName: string) {
  //   const chatRoom = await this.fetchChatByName(chatName);
  //   if (!chatRoom) {
  //     return false;
  //   }
  //   return this.checkPassword(password, chatRoom.password);
  // }

  // public async checkPasswordForChatByID(password: string, chatRoomID: number) {
  //   const chatRoom = await this.fetchChatByID(chatRoomID);
  //   if (!chatRoom) {
  //     return false;
  //   }
  //   return this.checkPassword(password, chatRoom.password);
  // }
}
