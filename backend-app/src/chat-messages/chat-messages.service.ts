import {
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatMessageEntity } from 'src/typeorm/entities/chat-message.entity';
import { Repository } from 'typeorm';
import { ChatsService } from 'src/chats/chats.service';
import { UsersService } from 'src/users/users.service';
import { ChatNotFoundError, UserNotFoundError } from 'src/exceptions/not-found.interceptor';

@Injectable()
export class ChatMessagesService {
  constructor(
    @InjectRepository(ChatMessageEntity)
    private chatMessagesRepository: Repository<ChatMessageEntity>,
    @Inject(forwardRef(() => ChatsService)) private chatService: ChatsService,
    @Inject(forwardRef(() => UsersService)) private userService: UsersService,
  ) {}

  fetchMessages() {
    return this.chatMessagesRepository.find({
      relations: ['chatRoom', 'sender'],
    });
  }

  async createMessage(
    message: string,
    sender: string,
    chatRoomName: string,
    sentTime: Date,
  ) {
    const chat = await this.chatService.fetchChatByName(chatRoomName);
    if (!chat)
      throw new ChatNotFoundError(chatRoomName);
    const user = await this.userService.fetchUserByUsername(sender);
    if (!user) {
      throw new UserNotFoundError(sender.toString());
    }
    const messageDetails = {
      message: message,
      sender: user,
      chatRoom: chat,
      sentAt: sentTime,
    };
    const newMessage = this.chatMessagesRepository.create({
      ...messageDetails,
    });
    return this.chatMessagesRepository.save(newMessage);
  }

  fetchMessage(id: number) {
    return this.chatMessagesRepository.findOne({
      where: { id },
      relations: { sender: true },
    });
  }

  async fetchMessagesByChatID(id: number) {
    const chatRoom = await this.chatService.fetchChatByID(id);
    return this.chatMessagesRepository.find({ where: { chatRoom } });
  }

  async deleteMessagesByChatID(id: number) {
    const chatRoom = await this.chatService.fetchChatByID(id);
    const messages = await this.chatMessagesRepository.find({
      where: { chatRoom },
    });
    messages.map((e) => {
      this.deleteMessage(e.id);
    });
  }

  deleteMessage(id: number) {
    return this.chatMessagesRepository.delete({ id });
  }
}
