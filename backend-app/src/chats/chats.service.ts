import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatEntity } from 'src/typeorm/entities/chat.entity';
import { Repository } from 'typeorm';
import { createChatParams, updateChatParams } from './utils/types';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ChatMessagesService } from 'src/chat-messages/chat-messages.service';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(ChatEntity)
    private chatRepository: Repository<ChatEntity>,
    @Inject(forwardRef(() => ChatMessagesService))
    private chatMessageService: ChatMessagesService,
  ) {}

  fetchChats() {
    return this.chatRepository.find();
  }

  async createChat(chatDetails: createChatParams) {
    const newChat = this.chatRepository.create({
      ...chatDetails,
      createdAt: new Date(),
    });
    return this.chatRepository.save(newChat).catch((err: any) => {
      console.log(err);
      throw new HttpException(
        'Error during channel creation',
        HttpStatus.BAD_REQUEST,
      );
    });
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

  fetchChatByName(name: string) {
    return this.chatRepository.findOne({
      where: { name },
      relations: ['messages'],
    });
  }

  updateChatByID(id: number, chatDetails: updateChatParams) {
    return this.chatRepository.update({ id }, { ...chatDetails });
  }

  async deleteChatByID(id: number) {
    await this.chatMessageService.deleteMessagesByChatID(id);
    console.log('Delete channel ' + id);
    return this.chatRepository.delete({ id });
  }
}
