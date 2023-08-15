import { Inject, Injectable, forwardRef } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ChatsService } from 'src/chats/chats.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class PasswordService {
  constructor(
    @Inject(forwardRef(() => UsersService))
      private userService: UsersService,
    @Inject(forwardRef( () => ChatsService))
      private chatService: ChatsService,
  ) {}

  async hashPassword(password: string) {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);
    console.log('[Password Service] Hashed password "', password, '"', hash);
    return hash;
  }
    
  async checkPassword(password: string, hash: string) {
    const isMatch = await bcrypt.compare(password, hash);
    console.log('[Password Service] Password "', password, '" is match?', isMatch);
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
