import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatParticipantEntity } from 'src/chat-participants/entities/chat-participant.entity';
import { Repository } from 'typeorm';
import { createParticipantParams, updateParticipantParams, UserChatInfo } from './utils/types';

@Injectable()
export class ChatParticipantsService {
  constructor(
    @InjectRepository(ChatParticipantEntity)
    private participantRepository: Repository<ChatParticipantEntity>,
  ) {}

  fetchParticipants() {
    return this.participantRepository.find({
      relations: ['chatRoom', 'user'],
    });
  }

  fetchParticipantByID(id: number) {
    return this.participantRepository.findOne({
      where: { id },
      relations: ['chatRoom', 'user'],
    });
  }

  fetchParticipantsByChatID(id: number) {
    return this.participantRepository.find({
      where: {
        chatRoom: { id: id },
      },
      relations: ['chatRoom', 'user'],
    });
  }

  fetchParticipantsByUserID(id: number) {
    return this.participantRepository.find({
      where: {
        user: { id: id },
      },
      relations: ['chatRoom', 'user'],
    });
  }

  fetchParticipantByUserChatID(info: UserChatInfo) {
    return this.participantRepository.findOne({
      where: {
        user: { id: info.userID },
        chatRoom: { id: info.chatRoomID },
      },
      relations: ['chatRoom', 'user'],
    });
  }  

  async recordAlreadyExists(userID: number, chatRoomID: number) {
    const foundRecord = await this.participantRepository.find({
      where: {
        user: { id: userID },
        chatRoom: { id: chatRoomID },
      },
    });
    if (foundRecord !== undefined) {
      return true;
    }
    return false;
  }

  async createChatParticipant(participantDetails: createParticipantParams) {
    const foundRecord = await this.participantRepository.find({
      where: {
        user: { id: participantDetails.userID },
        chatRoom: { id: participantDetails.chatRoomID },
      },
    });
    if (foundRecord.length > 0) {
      return foundRecord[0];
    }
    const newParticipant = this.participantRepository.create({
      user: { id: participantDetails.userID },
      chatRoom: { id: participantDetails.chatRoomID },
      owner: participantDetails.owner ? participantDetails.owner : false,
      operator: participantDetails.operator ? participantDetails.operator : false,
      banned: participantDetails.banned ? participantDetails.banned : false,
      mutedUntil: participantDetails.mutedUntil ? participantDetails.mutedUntil : 0,
    });
    return this.participantRepository.save(newParticipant);
  }

  async updateParticipantByID(
    id: number,
    participantDetails: updateParticipantParams,
  ) {
    return this.participantRepository.update({ id }, { ...participantDetails });
  }

  async deleteParticipantInChatByUserID(info: UserChatInfo) {
    const participant = await this.fetchParticipantByUserChatID(info);
    return this.deleteParticipantByID(participant.id);
  }

  async deleteParticipantByID(id: number) {
    return this.participantRepository.delete({ id });
  }
}
