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
import { ChatFetchError } from 'src/exceptions/bad-request.exception';
import { UserChatInfo } from 'src/chat-participants/utils/types';
import { PasswordService } from 'src/password/password.service';
import { ChatParticipantEntity } from 'src/chat-participants/entities/chat-participant.entity';

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
    return this.chatRepository.find();
  }

  fetchPublicChats() {
    return this.chatRepository.find({
      where: { isPrivate: false },
      relations: ['participants.user'],
    });
  }

  fetchDMChats() {
    return this.chatRepository.find({
      where: { directMessage: true },
      relations: ['participants.user'],
    });
  }

  async fetchParticipantUsernamesByChatName(chatRoomName: string) {
    const chat = await this.fetchChatByName(chatRoomName);
    if (!chat) {
      throw new ChatFetchError(chatRoomName);
    }
    const participantUsernames: participantUsernames[] = [];
    for (const e of chat.participants) {
      participantUsernames.push({
        username: e.user.username,
      });
    }
    return participantUsernames;
  }

  async createChat(chatDetails: createChatParams) {
    const user = await this.userService.fetchUserByID(chatDetails.ownerID);
    if (chatDetails.name.startsWith('DM:')) {
      throw new ChatCreationError(
        `'${chatDetails.name}': Chat name cannot start with "DM:"`,
      );
    }
    const passwordHash = await this.passwordService.hashPassword(
      chatDetails.password,
    );
    console.log('Chat details', chatDetails);
    const newChat = this.chatRepository.create({
      name: chatDetails.name,
      password: passwordHash,
      isPrivate: chatDetails.isPrivate ? chatDetails.isPrivate : false,
      directMessage: false,
      createdAt: new Date(),
    });
    const newSavedChat = await this.chatRepository
      .save(newChat)
      .catch((err: any) => {
        throw new ChatCreationError(`'${chatDetails.name}': ${err.message}`);
      });

    await this.chatParticipantService
      .createChatParticipant({
        userID: user.id,
        chatRoomID: newSavedChat.id,
        owner: true,
        operator: true,
        banned: false,
        mutedUntil: new Date().getTime(),
      })
      .catch((err: any) => {
        this.deleteChatByID(newSavedChat.id);
        throw new ChatCreationError(`'ownerID: ${user.id}': ${err.message}`);
      });

    console.log('New saved chat', newSavedChat);
    return newSavedChat;
  }

  private generateDMName(usernames: string[]) {
    usernames.sort((a, b) => a.localeCompare(b));
    return 'DM: ' + usernames[0] + ' ' + usernames[1];
  }

  private async checkDMDoesNotExist(chatDetails: createDMParams) {
    const chatDMs = await this.fetchDMChats();
    for (const e of chatDMs) {
      let count = 0;
      for (const f of e.participants) {
        if (
          f.user.id === chatDetails.userID1 ||
          f.user.id === chatDetails.userID2
        ) {
          count++;
        }
        if (count === 2) {
          throw new ChatCreationError(
            `DM between users ${chatDetails.userID1} and ${chatDetails.userID2}`,
          );
        }
      }
    }
  }

  async createChatDM(chatDetails: createDMParams) {
    const user1 = await this.userService.fetchUserByID(chatDetails.userID1);
    const user2 = await this.userService.fetchUserByID(chatDetails.userID2);

    await this.checkDMDoesNotExist(chatDetails);

    const newChat = this.chatRepository.create({
      name: this.generateDMName([user1.username, user2.username]),
      password: '',
      isPrivate: true,
      directMessage: true,
      createdAt: new Date(),
    });
    const newSavedChat = await this.chatRepository
      .save(newChat)
      .catch((err: any) => {
        throw new ChatCreationError(`'${newChat.name}': ${err.message}`);
      });
    try {
      await this.chatParticipantService.createChatParticipant({
        userID: user1.id,
        chatRoomID: newSavedChat.id,
      });
      await this.chatParticipantService.createChatParticipant({
        userID: user2.id,
        chatRoomID: newSavedChat.id,
      });
    } catch (err: any) {
      this.deleteChatByID(newSavedChat.id);
      throw new ChatCreationError(`${err.message}`);
    }

    return newSavedChat;
  }

  fetchChatByID(id: number) {
    return this.chatRepository.findOne({
      where: { id },
      relations: ['messages', 'participants.user'],
    });
  }

  async fetchChatParticipantsByID(
    id: number,
  ): Promise<ChatParticipantEntity[]> {
    const chat = await this.chatRepository.findOne({
      where: { id },
      relations: ['messages', 'participants.user'],
    });
    return chat.participants;
  }

  fetchChatByName(name: string) {
    return this.chatRepository.findOne({
      where: { name },
      relations: ['messages', 'participants.user'],
    });
  }

  async updateChatByID(id: number, chatDetails: updateChatParams) {
    const participant = chatDetails['participantID'];
    if (participant !== undefined) {
      this.chatParticipantService.createChatParticipant({
        userID: participant,
        chatRoomID: id,
      });
    }
    delete chatDetails['participantID'];
    const update = await this.chatRepository.update(
      { id },
      { isPrivate: chatDetails.isPrivate },
    );
    return update;
  }

  addParticipantToChatByID(id: number, userID: number) {
    this.chatParticipantService.createChatParticipant({
      userID: userID,
      chatRoomID: id,
    });
  }

  async addParticipantToChatByUserChatID(info: UserChatInfo) {
    return this.chatParticipantService.createChatParticipant({
      userID: info.userID,
      chatRoomID: info.chatRoomID,
    });
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
