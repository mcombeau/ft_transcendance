import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatEntity } from 'src/typeorm/entities/chat.entity';
import { Repository } from 'typeorm';
import { createChatParams, updateChatParams } from './utils/types';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ChatMessagesService } from 'src/chat-messages/chat-messages.service';
import { ChatParticipantsService } from 'src/chat-participants/chat-participants.service';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(ChatEntity)
    private chatRepository: Repository<ChatEntity>,
    @Inject(forwardRef(() => ChatMessagesService))
    private chatMessageService: ChatMessagesService,
    @Inject(forwardRef(() => ChatParticipantsService))
    private chatParticipantService: ChatParticipantsService,
  ) {}

  fetchChats() {
    return this.chatRepository.find({ relations: ['participants']});
  }

  async createChat(chatDetails: createChatParams) {
    const newChat = this.chatRepository.create({
      name: chatDetails.name,
      password: chatDetails.password,
      createdAt: new Date(),
    });
    console.log(chatDetails);
    const newSavedChat = await this.chatRepository.save(newChat).catch((err: any) => {
      console.log('---- Create chat error:');
      console.log(err);
      console.log('-----------------------');
      throw new BadRequestException('Chat room creation error');
    });
    const participant = await this.chatParticipantService.createChatParticipant(chatDetails.userID, newSavedChat.id).catch((err : any) => {
      console.log('---- Create chat participant error');
      this.deleteChatByID(newSavedChat.id);
      throw new HttpException('Could not create chat participant', HttpStatus.BAD_REQUEST);
    });
    console.log(participant);
    await this.chatParticipantService.updateParticipantByID(participant.id, { owner: true, operator: true, banned: false, muted: false });
    return (newSavedChat);
  }

  fetchChatByID(id: number) {
    return this.chatRepository.findOne({
      where: { id },
      relations: ['messages', 'participants'],
    });
  }

  fetchChatByName(name: string) {
    return this.chatRepository.findOne({
      where: { name },
      relations: ['messages'],
    });
  }

  updateChatByID(id: number, chatDetails: updateChatParams) {
    const participant = chatDetails['participant'];
    if (participant !== undefined) {
      console.log("Adding participant...");
      this.chatParticipantService.createChatParticipant(participant, id);
    }
    delete chatDetails['participant'];
    console.log("participant: " + participant);
    return this.chatRepository.update({ id }, { ...chatDetails });
  }

  addParticipantToChatByID(id: number, userID: number) {
    this.chatParticipantService.createChatParticipant(userID, id);
  }

  async deleteChatByID(id: number) {
    await this.chatMessageService.deleteMessagesByChatID(id);
    console.log('Delete channel ' + id);
    return this.chatRepository.delete({ id });
  }
}
