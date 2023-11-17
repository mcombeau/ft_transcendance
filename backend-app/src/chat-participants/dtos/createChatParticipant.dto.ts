import {ApiProperty} from '@nestjs/swagger';
import {
	IsBoolean,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsPositive,
} from 'class-validator';

export class createParticipantDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsInt()
	@IsPositive()
	userID: number;

	@ApiProperty()
	@IsNotEmpty()
	@IsInt()
	@IsPositive()
	chatRoomID: number;

	@ApiProperty()
	@IsBoolean()
	isOwner: boolean;

	@ApiProperty()
	@IsBoolean()
	isOperator: boolean;

	@ApiProperty()
	@IsBoolean()
	isBanned: boolean;

	@ApiProperty()
	@IsNumber()
	mutedUntil: number;
}
