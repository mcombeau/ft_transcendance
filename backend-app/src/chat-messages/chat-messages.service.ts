import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatMessageEntity } from 'src/typeorm/entities/chat-message.entity';
import { Repository } from 'typeorm';
import { createChatMessageParams } from 'src/chat-messages/utils/types';
import { ChatsService } from 'src/chats/chats.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ChatMessagesService {
  constructor(
    @InjectRepository(ChatMessageEntity)
    private chatMessagesRepository: Repository<ChatMessageEntity>,
    @Inject(forwardRef(() => ChatsService)) private chatService: ChatsService,
    @Inject(forwardRef(() => UsersService)) private userService: UsersService,
  ) {}

  fetchMessages() {
    return this.chatMessagesRepository.find();
  }

  async createMessage(
    message: string,
    senderID: number,
    chatRoomID: number,
    sentTime: Date,
  ) {
    console.log('Create Message!!!');
    const chat = await this.chatService.fetchChatByID(chatRoomID);
    if (!chat)
      throw new HttpException('Cannot find chat room', HttpStatus.BAD_REQUEST);
    const user = await this.userService.fetchUserByID(senderID);
    if (!user)
      throw new HttpException('Cannot find sender', HttpStatus.BAD_REQUEST);
    const messageDetails = {
      message: message,
      sender: user,
      chatRoom: chat,
      sentAt: sentTime,
    };
    const newMessage = this.chatMessagesRepository.create({
      ...messageDetails,
    });
    return this.chatMessagesRepository.save(newMessage);
  }

  fetchMessage(id: number) {
    return this.chatMessagesRepository.findOne({
      where: { id },
      relations: { sender: true },
    });
  }

  deleteMessage(id: number) {
    return this.chatMessagesRepository.delete({ id });
  }
}
