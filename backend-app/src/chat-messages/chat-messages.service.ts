import { HttpException, HttpStatus, Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatMessageEntity } from 'src/typeorm/entities/chat-message.entity';
import { Repository } from 'typeorm';
import { createChatMessageParams } from 'src/chat-messages/utils/types';
import { ChatsService } from 'src/chats/chats.service';

@Injectable()
export class ChatMessagesService {

    constructor(
        @InjectRepository(ChatMessageEntity) private chatMessagesRepository: Repository<ChatMessageEntity>,
        @Inject(forwardRef(() => ChatsService)) private chatService: ChatsService
    ) {}

    fetchMessages() {
        return this.chatMessagesRepository.find();
    }

    async createMessage(id: number, messageDetails: createChatMessageParams) {
        const chat = this.chatService.fetchChat(id);
        if (!chat)
            throw new HttpException("Cannot resolve chat room", HttpStatus.BAD_REQUEST);
        const newMessage = this.chatMessagesRepository.create({ ...messageDetails, sentAt: new Date() });
        return this.chatMessagesRepository.save(newMessage);
    }

    fetchMessage(id: number) {
        return this.chatMessagesRepository.findOne({ where: {id} });
    }

    deleteMessage(id: number) {
        return this.chatMessagesRepository.delete({ id });
    }
}
