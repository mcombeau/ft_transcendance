import {ApiProperty} from '@nestjs/swagger';

export class sendParticipantDto {
	@ApiProperty()
	userID: number;

	@ApiProperty()
	username: string;

	@ApiProperty()
	chatRoomID: number;

	@ApiProperty()
	isOwner: boolean;

	@ApiProperty()
	isOperator: boolean;

	@ApiProperty()
	isBanned: boolean;

	@ApiProperty()
	mutedUntil: number;
}
