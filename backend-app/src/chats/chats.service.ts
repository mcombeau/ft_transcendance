import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatEntity } from 'src/chats/entities/chat.entity';
import { Repository } from 'typeorm';
import {
  createChatParams,
  createDMParams,
  updateChatParams,
  participantUsernames,
} from './utils/types';
import { ChatMessagesService } from 'src/chat-messages/chat-messages.service';
import { ChatParticipantsService } from 'src/chat-participants/chat-participants.service';
import { ChatCreationError } from 'src/exceptions/bad-request.interceptor';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { ChatFetchError } from 'src/exceptions/bad-request.exception';
import { UserChatInfo } from 'src/chat-participants/utils/types';
import { PasswordService } from 'src/password/password.service';

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
    @Inject(forwardRef(() => PasswordService))
    private passwordService: PasswordService,
  ) {}

  fetchChats() {
    return this.chatRepository.find({
      relations: ['participants.participant'],
    });
  }

  fetchPublicChats() {
    return this.chatRepository.find({
      where: { private: false },
      relations: ['participants.participant'],
    });
  }

  fetchDMChats() {
    return this.chatRepository.find({
      where: { directMessage: true },
      relations: ['participants.participant'],
    });
  }

  async fetchParticipantUsernamesByChatName(chatRoomName: string) {
    const chat = await this.fetchChatByName(chatRoomName);
    if (!chat) {
      throw new ChatFetchError(chatRoomName);
    }
    var participantUsernames: participantUsernames[] = [];
    for (const e of chat.participants) {
      participantUsernames.push({
        username: e.participant.username,
      });
    }
    return participantUsernames;
  }

  async createChat(chatDetails: createChatParams) {
    if (chatDetails.name.startsWith('DM:')) {
      throw new ChatCreationError(
        `'${chatDetails.name}': Chat name cannot start with "DM:"`,
      );
    }
    const user = await this.userService.fetchUserByID(chatDetails.ownerID);
    const passwordHash = await this.passwordService.hashPassword(chatDetails.password);
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
    });
    return newSavedChat;
  }

  async createChatDM(chatDetails: createDMParams) {
    if (!chatDetails.name.startsWith('DM:')) {
      throw new ChatCreationError(
        `'${chatDetails.name}': DM chat must start with "DM:"`,
      );
    }
    const user1 = await this.userService.fetchUserByID(chatDetails.userID1);
    const user2 = await this.userService.fetchUserByID(chatDetails.userID2);
    // TODO [mcombeau]: Create an encoded name !
    const name = user1.username + user2.username;
    const newChat = this.chatRepository.create({
      name: name,
      password: "",
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
        0,
      );
      await this.chatParticipantService.createChatParticipant(
        user2.id,
        newSavedChat.id,
        0,
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

  async addParticipantToChatByUserChatID(info: UserChatInfo) {
    return this.chatParticipantService.createChatParticipant(
      info.userID,
      info.chatRoomID,
      0,
    );
  }

  async inviteParticipantToChatByID(
    info: UserChatInfo,
    inviteExpiryDate: number,
  ) {
    return this.chatParticipantService.createChatParticipant(
      info.userID,
      info.chatRoomID,
      inviteExpiryDate,
    );
  }

  removeParticipantFromChatByID(info: UserChatInfo) {
    this.chatParticipantService.deleteParticipantInChatByUserID(info);
  }

  async removeParticipantFromChatByUsername(info: UserChatInfo) {
    this.chatParticipantService.deleteParticipantInChatByUserID(info);
  }

  async deleteChatByID(id: number) {
    await this.chatMessageService.deleteMessagesByChatID(id);
    console.log('Delete channel ' + id);
    return this.chatRepository.delete({ id });
  }
}
