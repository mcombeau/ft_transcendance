import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatMessageEntity } from 'src/typeorm/entities/chat-message.entity';
import { Repository } from 'typeorm';
import { createChatMessageParams } from './utils/types';

@Injectable()
export class ChatMessagesService {

    constructor(@InjectRepository(ChatMessageEntity) private chatMessagesRepository: Repository<ChatMessageEntity>) {}

    fetchMessages() {
        return this.chatMessagesRepository.find();
    }

    createMessage(messageDetails: createChatMessageParams) {
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
