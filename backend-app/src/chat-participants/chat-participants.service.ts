import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatParticipantEntity } from 'src/chat-participants/entities/chat-participant.entity';
import { Repository } from 'typeorm';
import { updateParticipantParams, UserChatInfo } from './utils/types';

@Injectable()
export class ChatParticipantsService {
  constructor(
    @InjectRepository(ChatParticipantEntity)
    private participantRepository: Repository<ChatParticipantEntity>,
  ) {}

  fetchParticipants() {
    return this.participantRepository.find({
      relations: ['chatRoom', 'participant'],
    });
  }

  fetchParticipantByID(id: number) {
    return this.participantRepository.findOne({
      where: { id },
      relations: ['chatRoom', 'participant'],
    });
  }

  fetchParticipantsByChatID(id: number) {
    return this.participantRepository.find({
      where: {
        chatRoom: { id: id },
      },
      relations: ['chatRoom', 'participant'],
    });
  }

  // async fetchParticipantsByChatname(channel_name: string) {
  //   var chat = await this.chatService.fetchChatByName(channel_name);
  //   return this.fetchParticipantsByChatID(chat.id);
  // }

  fetchParticipantsByUserID(id: number) {
    return this.participantRepository.find({
      where: {
        user: { id: id },
      },
      relations: ['chatRoom', 'participant'],
    });
  }

  // async fetchParticipantsByUsername(username: string) {
  //   var user = await this.userService.fetchUserByUsername(username);
  //   return this.fetchParticipantsByUserID(user.id);
  // }

  fetchParticipantByUserChatID(info: UserChatInfo) {
    return this.participantRepository.findOne({
      where: {
        user: { id: info.userID },
        chatRoom: { id: info.chatRoomID },
      },
      relations: ['chatRoom', 'participant'],
    });
  }

  // async fetchParticipantByUserChatNames(
  //   username: string,
  //   channel_name: string,
  // ) {
  //   var channel = await this.chatService.fetchChatByName(channel_name);
  //   var user = await this.userService.fetchUserByUsername(username);
  //   return this.participantRepository.findOne({
  //     where: {
  //       participant: { id: user.id },
  //       chatRoom: { id: channel.id },
  //     },
  //     relations: ['chatRoom', 'participant'],
  //   });
  // }
  //

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

  async createChatParticipant(
    userID: number,
    chatRoomID: number,
    inviteExpiryDate: number,
  ) {
    const foundRecord = await this.participantRepository.find({
      where: {
        user: { id: userID },
        chatRoom: { id: chatRoomID },
      },
    });
    if (foundRecord.length > 0) {
      return foundRecord[0];
    }
    const newParticipant = this.participantRepository.create({
      user: { id: userID },
      chatRoom: { id: chatRoomID },
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

  // async deleteParticipantInChatByUsername(username: string, chat_name: string) {
  //   const chat = await this.chatService.fetchChatByName(chat_name);
  //   const user = await this.userService.fetchUserByUsername(username);
  //   const participant = await this.fetchParticipantByUserChatID(
  //     user.id,
  //     chat.id,
  //   );
  //   return this.deleteParticipantByID(participant.id);
  // }

  async deleteParticipantByID(id: number) {
    return this.participantRepository.delete({ id });
  }
}
