import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatsService } from 'src/chats/chats.service';
import { ChatParticipantEntity } from 'src/typeorm/entities/chat-participant.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { updateParticipantParams } from './utils/types';

@Injectable()
export class ChatParticipantsService {
  constructor(
    @InjectRepository(ChatParticipantEntity)
    private participantRepository: Repository<ChatParticipantEntity>,
    @Inject(forwardRef(() => ChatsService))
    private chatService: ChatsService,
    @Inject(forwardRef(() => UsersService))
    private userService: UsersService,
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

  async fetchParticipantsByChatname(channel_name: string) {
    var chat = await this.chatService.fetchChatByName(channel_name);
    return this.fetchParticipantsByChatID(chat.id);
  }

  fetchParticipantsByUserID(id: number) {
    return this.participantRepository.find({
      where: {
        participant: { id: id },
      },
      relations: ['chatRoom', 'participant'],
    });
  }

  async fetchParticipantsByUsername(username: string) {
    var user = await this.userService.fetchUserByUsername(username);
    return this.fetchParticipantsByUserID(user.id);
  }

  fetchParticipantByUserChatID(userID: number, chatRoomID: number) {
    return this.participantRepository.findOne({
      where: {
        participant: { id: userID },
        chatRoom: { id: chatRoomID },
      },
      relations: ['chatRoom', 'participant'],
    });
  }

  async fetchParticipantByUserChatNames(
    username: string,
    channel_name: string,
  ) {
    var channel = await this.chatService.fetchChatByName(channel_name);
    var user = await this.userService.fetchUserByUsername(username);
    return this.participantRepository.findOne({
      where: {
        participant: { id: user.id },
        chatRoom: { id: channel.id },
      },
      relations: ['chatRoom', 'participant'],
    });
  }

  async recordAlreadyExists(userID: number, chatRoomID: number) {
    const foundRecord = await this.participantRepository.find({
      where: {
        participant: { id: userID },
        chatRoom: { id: chatRoomID },
      },
    });
    if (foundRecord !== undefined) {
      return true;
    }
    return false;
  }

  async createChatParticipant(userID: number, chatRoomID: number) {
    const foundRecord = await this.participantRepository.find({
      where: {
        participant: { id: userID },
        chatRoom: { id: chatRoomID },
      },
    });
    console.log(foundRecord.length);
    console.log(foundRecord);
    if (foundRecord.length > 0) {
      console.log('User is already in chat room');
      console.log(foundRecord);
      return foundRecord[0];
    }
    const newParticipant = this.participantRepository.create({
      participant: { id: userID },
      chatRoom: { id: chatRoomID },
    });
    console.log(newParticipant);
    return this.participantRepository.save(newParticipant);
  }

  async updateParticipantByID(
    id: number,
    participantDetails: updateParticipantParams,
  ) {
    return this.participantRepository.update({ id }, { ...participantDetails });
  }

  async deleteParticipantInChatByUserID(userID: number, chatRoomID: number) {
    const participant = await this.fetchParticipantByUserChatID(
      userID,
      chatRoomID,
    );
    return this.deleteParticipantByID(participant.id);
  }

  async deleteParticipantByID(id: number) {
    return this.participantRepository.delete({ id });
  }

  async userIsOwner(channel_name: string, username: string) {
    const channel = await this.chatService.fetchChatByName(channel_name);
    const user = await this.userService.fetchUserByUsername(username);

    const participant = await this.fetchParticipantByUserChatID(
      user.id,
      channel.id,
    );

    return participant.owner;
  }

  async userIsOperator(channel_name: string, username: string) {
    const channel = await this.chatService.fetchChatByName(channel_name);
    const user = await this.userService.fetchUserByUsername(username);

    const participant = await this.fetchParticipantByUserChatID(
      user.id,
      channel.id,
    );

    return participant.operator;
  }

  async userIsMuted(channel_name: string, username: string) {
    const channel = await this.chatService.fetchChatByName(channel_name);
    const user = await this.userService.fetchUserByUsername(username);

    const participant = await this.fetchParticipantByUserChatID(
      user.id,
      channel.id,
    );

    return participant.muted;
  }

  async userIsBanned(channel_name: string, username: string) {
    const channel = await this.chatService.fetchChatByName(channel_name);
    const user = await this.userService.fetchUserByUsername(username);

    const participant = await this.fetchParticipantByUserChatID(
      user.id,
      channel.id,
    );

    return participant.banned;
  }
}
