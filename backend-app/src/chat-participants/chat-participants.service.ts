import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {ChatParticipantEntity} from 'src/chat-participants/entities/chat-participant.entity';
import {DeleteResult, Repository, UpdateResult} from 'typeorm';
import {
	createParticipantParams,
	updateParticipantParams,
	UserChatInfo,
} from './utils/types';
import {sendParticipantDto} from './dtos/sendChatParticipant.dto';

@Injectable()
export class ChatParticipantsService {
	constructor(
		@InjectRepository(ChatParticipantEntity)
		private participantRepository: Repository<ChatParticipantEntity>,
	) {}

	private formatParticipantForSending(
		participant: ChatParticipantEntity,
	): sendParticipantDto {
		const sendParticipant: sendParticipantDto = {
			userID: participant.user.id,
			username: participant.user.username,
			chatRoomID: participant.chatRoom.id,
			isOwner: participant.isOwner,
			isOperator: participant.isOperator,
			isBanned: participant.isBanned,
			mutedUntil: participant.mutedUntil,
		};
		return sendParticipant;
	}

	private formatParticipantArrayForSending(
		participants: ChatParticipantEntity[],
	): sendParticipantDto[] {
		return participants.map(this.formatParticipantForSending);
	}

	async fetchParticipants(): Promise<sendParticipantDto[]> {
		const participants = await this.participantRepository.find({
			relations: ['chatRoom', 'user'],
		});
		return this.formatParticipantArrayForSending(participants);
	}

	async fetchParticipantByID(id: number): Promise<sendParticipantDto> {
		const participant = await this.participantRepository.findOne({
			where: {id},
			relations: ['chatRoom', 'user'],
		});
		return this.formatParticipantForSending(participant);
	}

	async fetchParticipantsByChatID(id: number): Promise<sendParticipantDto[]> {
		const participants = await this.participantRepository.find({
			where: {chatRoom: {id: id}},
			relations: ['chatRoom', 'user'],
		});
		return this.formatParticipantArrayForSending(participants);
	}

	async fetchParticipantsByUserID(id: number): Promise<sendParticipantDto[]> {
		const participants = await this.participantRepository.find({
			where: {user: {id: id}},
			relations: ['chatRoom', 'user'],
		});
		return this.formatParticipantArrayForSending(participants);
	}

	async fetchParticipantByUserChatID(
		info: UserChatInfo,
	): Promise<sendParticipantDto> {
		const participant = await this.fetchParticipantEntityByUserChatID(info);
		return this.formatParticipantForSending(participant);
	}

	async fetchParticipantEntityByUserChatID(
		info: UserChatInfo,
	): Promise<ChatParticipantEntity> {
		return this.participantRepository.findOne({
			where: {
				user: {id: info.userID},
				chatRoom: {id: info.chatRoomID},
			},
			relations: ['chatRoom', 'user'],
		});
	}

	async createChatParticipant(
		participantDetails: createParticipantParams,
	): Promise<ChatParticipantEntity> {
		const foundRecord = await this.participantRepository.find({
			where: {
				user: {id: participantDetails.userID},
				chatRoom: {id: participantDetails.chatRoomID},
			},
		});
		if (foundRecord.length > 0) {
			return foundRecord[0];
		}
		const newParticipant = this.participantRepository.create({
			user: {id: participantDetails.userID},
			chatRoom: {id: participantDetails.chatRoomID},
			isOwner: participantDetails.isOwner ? participantDetails.isOwner : false,
			isOperator: participantDetails.isOperator
				? participantDetails.isOperator
				: false,
			isBanned: participantDetails.isBanned
				? participantDetails.isBanned
				: false,
			mutedUntil: participantDetails.mutedUntil
				? participantDetails.mutedUntil
				: 0,
		});
		return this.participantRepository.save(newParticipant);
	}

	async updateParticipantByID(
		id: number,
		participantDetails: updateParticipantParams,
	): Promise<UpdateResult> {
		return this.participantRepository.update({id}, {...participantDetails});
	}

	async deleteParticipantInChatByUserID(
		info: UserChatInfo,
	): Promise<DeleteResult> {
		const participant = await this.fetchParticipantEntityByUserChatID(info);
		return this.deleteParticipantByID(participant.id);
	}

	async deleteParticipantByID(id: number): Promise<DeleteResult> {
		return this.participantRepository.delete({id});
	}
}
