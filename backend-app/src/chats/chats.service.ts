import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatEntity } from 'src/typeorm/entities/chat.entity';
import { Repository } from 'typeorm';
import { createChatParams, updateChatParams } from './utils/types';

@Injectable()
export class ChatsService {
    
    constructor(@InjectRepository(ChatEntity) private chatRepository: Repository<ChatEntity>,) {}
    
    fetchChats() {
        return this.chatRepository.find();
    }

    createChat(chatDetails: createChatParams) {
        const newChat = this.chatRepository.create({...chatDetails, createdAt: new Date() });
        return this.chatRepository.save(newChat);
    }

    fetchChat(id: number) {
        return this.chatRepository.findOne({ where: {id} });
    }

    updateChat(id: number, chatDetails: updateChatParams) {
        return this.chatRepository.update({ id }, { ...chatDetails });
    }

    deleteChat(id: number) {
        return this.chatRepository.delete({ id });
    }

}
