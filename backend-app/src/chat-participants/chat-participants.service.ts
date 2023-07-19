import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatsService } from 'src/chats/chats.service';
import { ChatParticipantEntity } from 'src/typeorm/entities/chat-participant.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';

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
        })
    }

    async recordAlreadyExists(userID: number, chatRoomID: number) {
        const foundRecord = await this.participantRepository.find({
            where: {
                participant: { id: userID },
                chatRoom: { id: chatRoomID }
            }
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
                chatRoom: { id: chatRoomID }
            }
        });
        if (foundRecord !== undefined) {
            console.log('User is already in chat room');
            return foundRecord;
        }
        const newParticipant = this.participantRepository.create({
            participant: { id: userID },
            chatRoom: { id: chatRoomID },
            operator: false,
            banned: false,
        });
        return this.participantRepository.save(newParticipant).catch((err: any) => {
            console.log(err);
            throw new HttpException(
                'Error during participant creation',
                HttpStatus.BAD_REQUEST,
            );
        });
    }

    async deleteParticipantByID(id: number) {
        return this.participantRepository.delete({ id });
    }
}
