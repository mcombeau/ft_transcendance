import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatEntity } from 'src/chats/entities/chat.entity';
import { Repository } from 'typeorm';
import {
  createChatParams,
  createDMParams,
  updateChatParams,
} from './utils/types';
import { ChatMessagesService } from 'src/chat-messages/chat-messages.service';
import { ChatParticipantsService } from 'src/chat-participants/chat-participants.service';
import { ChatCreationError } from 'src/exceptions/bad-request.interceptor';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(ChatEntity)
    private chatRepository: Repository<ChatEntity>,
    @Inject(forwardRef(() => ChatMessagesService))
    private chatMessageService: ChatMessagesService,
    @Inject(forwardRef(() => ChatParticipantsService))
    private chatParticipantService: ChatParticipantsService,
    @Inject(forwardRef(() => UsersService))
    private userService: UsersService,
  ) {}

  private async hashPassword(password: string) {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);
    console.log("[Chat Service] Hashed password \"", password, "\"", hash);
    return hash;
  }

  private async checkPassword(password: string, hash: string) {
    const isMatch = await bcrypt.compare(password, hash);
    console.log("[Chat Service] Password \"", password, "\" is match?", isMatch);
    return isMatch;
  }

  public async checkPasswordForChatByName(password: string, chatName: string) {
    const chatRoom = await this.fetchChatByName(chatName);
    if (!chatRoom) {
      return false;
    }
    return this.checkPassword(password, chatRoom.password);
  }

  public async checkPasswordForChatByID(password: string, chatRoomID: number) {
    const chatRoom = await this.fetchChatByID(chatRoomID);
    if (!chatRoom) {
      return false;
    }
    return this.checkPassword(password, chatRoom.password);
  }

  fetchChats() {
    return this.chatRepository.find({
      relations: ['participants.participant'],
    });
  }

  async createChat(chatDetails: createChatParams) {
    const user = await this.userService.fetchUserByUsername(chatDetails.owner);
    const passwordHash = await this.hashPassword(chatDetails.password);
    const newChat = this.chatRepository.create({
      name: chatDetails.name,
      password: passwordHash,
      private: chatDetails.private,
      directMessage: false,
      createdAt: new Date(),
    });
    const newSavedChat = await this.chatRepository
      .save(newChat)
      .catch((err: any) => {
        throw new ChatCreationError(`'${chatDetails.name}': ${err.message}`);
      });
    const participant = await this.chatParticipantService
      .createChatParticipant(user.id, newSavedChat.id, 0)
      .catch((err: any) => {
        this.deleteChatByID(newSavedChat.id);
        throw new ChatCreationError(`'ownerID: ${user.id}': ${err.message}`);
      });
    await this.chatParticipantService.updateParticipantByID(participant.id, {
      owner: true,
      operator: true,
      banned: false,
      mutedUntil: new Date().getTime(),
      invitedUntil: 0
    });
    return newSavedChat;
  }

  async createChatDM(chatDetails: createDMParams) {
    const user1 = await this.userService.fetchUserByUsername(chatDetails.user1);
    const user2 = await this.userService.fetchUserByUsername(chatDetails.user2);
    const newChat = this.chatRepository.create({
      name: chatDetails.name,
      password: chatDetails.password,
      private: true,
      directMessage: true,
      createdAt: new Date(),
    });
    const newSavedChat = await this.chatRepository
      .save(newChat)
      .catch((err: any) => {
        throw new ChatCreationError(`'${chatDetails.name}': ${err.message}`);
      });
    try {
      await this.chatParticipantService.createChatParticipant(
        user1.id,
        newSavedChat.id,
        0
      );
      await this.chatParticipantService.createChatParticipant(
        user2.id,
        newSavedChat.id,
        0
      );
    } catch (err: any) {
      this.deleteChatByID(newSavedChat.id);
      throw new ChatCreationError(`${err.message}`);
    }

    return newSavedChat;
  }

  fetchChatByID(id: number) {
    return this.chatRepository.findOne({
      where: { id },
      relations: ['messages', 'participants.participant'],
    });
  }

  fetchChatByName(name: string) {
    return this.chatRepository.findOne({
      where: { name },
      relations: ['messages', 'participants.participant'],
    });
  }

  updateChatByID(id: number, chatDetails: updateChatParams) {
    const participant = chatDetails['participantID'];
    if (participant !== undefined) {
      this.chatParticipantService.createChatParticipant(participant, id, 0);
    }
    delete chatDetails['participantID'];
    return this.chatRepository.update({ id }, { ...chatDetails });
  }

  addParticipantToChatByID(id: number, userID: number) {
    this.chatParticipantService.createChatParticipant(userID, id, 0);
  }

  async addParticipantToChatByUsername(chatRoomName: string, username: string) {
    const user = await this.userService.fetchUserByUsername(username);
    const chatRoom = await this.fetchChatByName(chatRoomName);

    return this.chatParticipantService.createChatParticipant(
      user.id,
      chatRoom.id,
      0
    );
  }

  async inviteParticipantToChatByUsername(chatRoomName: string, username: string, inviteExpiryDate: number) {
    const user = await this.userService.fetchUserByUsername(username);
    const chatRoom = await this.fetchChatByName(chatRoomName);

    return this.chatParticipantService.createChatParticipant(
      user.id,
      chatRoom.id,
      inviteExpiryDate
    );
  }

  removeParticipantFromChatByID(id: number, userID: number) {
    this.chatParticipantService.deleteParticipantInChatByUserID(userID, id);
  }

  async removeParticipantFromChatByUsername(name: string, username: string) {
    const participant = await this.userService.fetchUserByUsername(username);
    const channelID = await this.fetchChatByName(name);
    this.chatParticipantService.deleteParticipantInChatByUserID(
      participant.id,
      channelID.id,
    );
  }

  async deleteChatByID(id: number) {
    await this.chatMessageService.deleteMessagesByChatID(id);
    console.log('Delete channel ' + id);
    return this.chatRepository.delete({ id });
  }
}
