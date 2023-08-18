import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatsService } from 'src/chats/chats.service';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { inviteParams } from './utils/types';
import { InviteEntity, inviteType } from './entities/Invite.entity';
import { InviteCreationError } from 'src/exceptions/bad-request.interceptor';

@Injectable()
export class InvitesService {
  constructor(
    @InjectRepository(InviteEntity)
    private inviteRepository: Repository<InviteEntity>,
    @Inject(forwardRef(() => ChatsService))
    private chatService: ChatsService,
    @Inject(forwardRef(() => UsersService))
    private userService: UsersService,
  ) {}

  fetchAllInvites() {
    return this.inviteRepository.find({
      relations: ['inviteSender', 'invitedUser', 'chatRoom'],
    });
  }

  fetchInviteByID(id: number) {
    return this.inviteRepository.findOne({
      where: { id: id },
      relations: ['inviteSender', 'invitedUser', 'chatRoom'],
    });
  }

  async fetchInvitesByInvitedID(userID: number) {
    const user = await this.userService.fetchUserByID(userID);
    return this.inviteRepository.find({
      where: { invitedUser: user },
      relations: ['inviteSender', 'invitedUser', 'chatRoom'],
    });
  }

  async fetchInvitesBySenderID(userID: number) {
    const user = await this.userService.fetchUserByID(userID);
    return this.inviteRepository.find({
      where: { inviteSender: user },
      relations: ['inviteSender', 'invitedUser', 'chatRoom'],
    });
  }

  async fetchInvitesByChatRoomID(chatRoomID: number) {
    const chatRoom = await this.chatService.fetchChatByID(chatRoomID);
    return this.inviteRepository.find({
      where: { chatRoom: chatRoom },
      relations: ['inviteSender', 'invitedUser', 'chatRoom'],
    });
  }

  async fetchInviteByInvitedUserChatRoomID(
    invitedUserID: number,
    chatRoomID: number,
  ) {
    const chatRoom = await this.chatService.fetchChatByID(chatRoomID);
    const user = await this.userService.fetchUserByID(invitedUserID);
    return this.inviteRepository.findOne({
      where: { invitedUser: user, chatRoom: chatRoom },
      relations: ['inviteSender', 'invitedUser', 'chatRoom'],
    });
  }

  async fetchAllInvitesByInvitedUserChatRoomIDs(
    invitedUserID: number,
    chatRoomID: number,
  ) {
    const chatRoom = await this.chatService.fetchChatByID(chatRoomID);
    const user = await this.userService.fetchUserByID(invitedUserID);
    return this.inviteRepository.find({
      where: { invitedUser: user, chatRoom: chatRoom },
      relations: ['inviteSender', 'invitedUser', 'chatRoom'],
    });
  }

  async createInvite(inviteDetails: inviteParams): Promise<InviteEntity> {
    switch (inviteDetails.type) {
      case inviteType.CHAT:
        return this.createChatInvite(inviteDetails);
      // case inviteType.GAME:
      //   return this.createGameInvite(inviteDetails);
      // case inviteType.FRIEND:
      //   return this.createFriendInvite(inviteDetails);
      default:
        throw new InviteCreationError('invalid invite type.');
    }
  }

  private async createChatInvite(inviteDetails: inviteParams) {
    const sender = await this.userService.fetchUserByID(
      inviteDetails.senderUserID,
    );
    const invitedUser = await this.userService.fetchUserByID(
      inviteDetails.invitedUserID,
    );
    const chatRoom = await this.chatService.fetchChatByID(
      inviteDetails.chatRoomID,
    );

    if (!sender || !invitedUser || !chatRoom) {
      throw new InviteCreationError('invalid parameters for invite creation.');
    }

    var inviteExpiry = new Date(
      Date.now() + 1 * (60 * 60 * 1000), // time + 1 hour
    ).getTime();

    var invite = await this.inviteRepository.findOne({
      where: {
        inviteSender: sender,
        invitedUser: invitedUser,
        chatRoom: chatRoom,
      },
    });
    if (invite) {
      // invite already exists, updating invite expiry.
      await this.inviteRepository.update(invite.id, {
        expiresAt: inviteExpiry,
      });
      return this.fetchInviteByID(invite.id);
    } else {
      return this.inviteRepository.save({
        type: inviteType.CHAT,
        expiresAt: inviteExpiry,
        inviteSender: sender,
        invitedUser: invitedUser,
        chatRoom: chatRoom,
      });
    }
  }

  private async createGameInvite(inviteDetails: inviteParams) {
    // TODO [mcombeau]: implement this
    throw new InviteCreationError('game invites not implemented yet.');
  }

  private async createFriendInvite(inviteDetails: inviteParams) {
    // TODO [mcombeau]: implement this
    throw new InviteCreationError('friend invites not implemented yet.');
  }

  async deleteInvitesByInvitedUserChatRoomName(
    invitedUserID: number,
    chatRoomID: number,
  ) {
    const invites = await this.fetchAllInvitesByInvitedUserChatRoomIDs(
      invitedUserID,
      chatRoomID,
    );
    for (const e of invites) {
      await this.deleteInviteByID(e.id);
    }
    return;
  }

  async deleteInviteByID(id: number) {
    return this.inviteRepository.delete({ id });
  }
}
