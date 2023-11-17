import {Inject, Injectable, forwardRef} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {ChatMessageEntity} from 'src/chat-messages/entities/chat-message.entity';
import {Repository, DeleteResult} from 'typeorm';
import {ChatsService} from 'src/chats/chats.service';
import {UsersService} from 'src/users/users.service';
import {
	ChatNotFoundError,
	UserNotFoundError,
} from 'src/exceptions/not-found.interceptor';
import {createChatMessageParams} from './utils/types';
import {sendChatMessageDto} from './dtos/sendChatMessage.dto';

@Injectable()
export class ChatMessagesService {
	constructor(
		@InjectRepository(ChatMessageEntity)
		private chatMessagesRepository: Repository<ChatMessageEntity>,
		@Inject(forwardRef(() => ChatsService)) private chatService: ChatsService,
		@Inject(forwardRef(() => UsersService)) private userService: UsersService,
	) {}

	private formatChatMessageForSending(
		message: ChatMessageEntity,
	): sendChatMessageDto {
		const sendMessage: sendChatMessageDto = {
			messageID: message.id,
			message: message.message,
			senderID: message.sender.id,
			senderUsername: message.sender.username,
			chatRoomID: message.chatRoom.id,
			sentAt: message.sentAt,
		};
		return sendMessage;
	}

	private formatChatMessageArrayForSending(
		messages: ChatMessageEntity[],
	): sendChatMessageDto[] {
		return messages.map(this.formatChatMessageForSending);
	}

	async fetchMessages(): Promise<sendChatMessageDto[]> {
		const messages = await this.chatMessagesRepository.find({
			relations: ['chatRoom', 'sender'],
		});
		return this.formatChatMessageArrayForSending(messages);
	}

	async fetchMessage(id: number): Promise<sendChatMessageDto> {
		const message = await this.chatMessagesRepository.findOne({
			where: {id},
			relations: {sender: true},
		});
		return this.formatChatMessageForSending(message);
	}

	async fetchMessagesByChatID(id: number): Promise<sendChatMessageDto[]> {
		const chatRoom = await this.chatService.fetchChatByID(id);
		const messages = await this.chatMessagesRepository.find({
			where: {chatRoom: chatRoom},
			relations: ['chatRoom', 'sender'],
		});
		return this.formatChatMessageArrayForSending(messages);
	}

	async createMessage(
		chatMessageDetails: createChatMessageParams,
	): Promise<ChatMessageEntity> {
		const chat = await this.chatService.fetchChatByID(
			chatMessageDetails.chatRoomID,
		);
		if (!chat)
			throw new ChatNotFoundError(chatMessageDetails.chatRoomID.toString());
		const user = await this.userService.fetchUserByID(
			chatMessageDetails.senderID,
		);
		if (!user) {
			throw new UserNotFoundError(chatMessageDetails.senderID.toString());
		}
		const newMessage = this.chatMessagesRepository.create({
			sender: user,
			message: chatMessageDetails.message,
			chatRoom: chat,
			sentAt: new Date(),
		});
		return this.chatMessagesRepository.save(newMessage);
	}

	async deleteMessagesByChatID(id: number) {
		const chatRoom = await this.chatService.fetchChatByID(id);
		const messages = await this.chatMessagesRepository.find({
			where: {chatRoom},
		});
		messages.map((e) => {
			this.deleteMessage(e.id);
		});
	}

	deleteMessage(id: number): Promise<DeleteResult> {
		return this.chatMessagesRepository.delete({id});
	}
}
