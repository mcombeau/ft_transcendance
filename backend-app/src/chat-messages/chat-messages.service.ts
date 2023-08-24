import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatMessageEntity } from 'src/chat-messages/entities/chat-message.entity';
import { Repository } from 'typeorm';
import { ChatsService } from 'src/chats/chats.service';
import { UsersService } from 'src/users/users.service';
import {
  ChatNotFoundError,
  UserNotFoundError,
} from 'src/exceptions/not-found.interceptor';
import { createChatMessageParams } from './utils/types';

@Injectable()
export class ChatMessagesService {
  constructor(
    @InjectRepository(ChatMessageEntity)
    private chatMessagesRepository: Repository<ChatMessageEntity>,
    @Inject(forwardRef(() => ChatsService)) private chatService: ChatsService,
    @Inject(forwardRef(() => UsersService)) private userService: UsersService,
  ) {}

  async fetchMessages() {
    const msg = await this.chatMessagesRepository.find({
      relations: ['chatRoom', 'sender'],
    });
    console.log('In chatmessage service: ', msg);
    return msg;
  }

  async createMessage(chatMessageDetails: createChatMessageParams) {
    const chat = await this.chatService.fetchChatByID(
      chatMessageDetails.chatRoomID,
    );
    if (!chat)
      throw new ChatNotFoundError(chatMessageDetails.chatRoomID.toString());
    const user = await this.userService.fetchUserByID(
      chatMessageDetails.senderID,
    );
    if (!user) {
      throw new UserNotFoundError(chatMessageDetails.senderID.toString());
    }
    const newMessage = this.chatMessagesRepository.create({
      sender: user,
      message: chatMessageDetails.message,
      chatRoom: chat,
      sentAt: new Date(),
    });
    console.log('new message', newMessage);
    return this.chatMessagesRepository.save(newMessage);
  }

  fetchMessage(id: number) {
    return this.chatMessagesRepository.findOne({
      where: { id },
      relations: { sender: true },
    });
  }

  async fetchMessagesByChatID(id: number) {
    const chatRoom = await this.chatService.fetchChatByID(id);
    return this.chatMessagesRepository.find({ where: { chatRoom } });
  }

  async deleteMessagesByChatID(id: number) {
    const chatRoom = await this.chatService.fetchChatByID(id);
    const messages = await this.chatMessagesRepository.find({
      where: { chatRoom },
    });
    messages.map((e) => {
      this.deleteMessage(e.id);
    });
  }

  deleteMessage(id: number) {
    return this.chatMessagesRepository.delete({ id });
  }
}
