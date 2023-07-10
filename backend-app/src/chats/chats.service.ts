import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatEntity } from 'src/typeorm/entities/chat.entity';
import { Repository } from 'typeorm';
import { createChatParams, updateChatParams } from './utils/types';
import { createChatMessageParams } from 'src/chat-messages/utils/types';
import { ChatMessagesService } from 'src/chat-messages/chat-messages.service';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(ChatEntity)
    private chatRepository: Repository<ChatEntity>,
  ) {}

  fetchChats() {
    return this.chatRepository.find({ relations: ['messages'] });
  }

  createChat(chatDetails: createChatParams) {
    const newChat = this.chatRepository.create({
      ...chatDetails,
      createdAt: new Date(),
    });
    return this.chatRepository.save(newChat);
  }

  // createChatMessage(id: number, messageDetails: createChatMessageParams) {
  //     return this.chatMessageService.createMessage(messageDetails, messageDetails.sender, messageDetails.chatRoom);
  // }

  fetchChatByID(id: number) {
    return this.chatRepository.findOne({
      where: { id },
      relations: ['messages'],
    });
  }

  updateChatByID(id: number, chatDetails: updateChatParams) {
    return this.chatRepository.update({ id }, { ...chatDetails });
  }

  deleteChatByID(id: number) {
    return this.chatRepository.delete({ id });
  }
}
