import {ApiProperty} from '@nestjs/swagger';
import {
	IsEnum,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsPositive,
} from 'class-validator';
import {inviteType} from '../entities/Invite.entity';

export class createInviteDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsEnum(inviteType)
	type: inviteType;

	@ApiProperty()
	@IsNotEmpty()
	@IsInt()
	@IsPositive()
	senderID: number;

	@ApiProperty()
	@IsNotEmpty()
	@IsInt()
	@IsPositive()
	invitedUserID: number;

	@ApiProperty()
	@IsOptional()
	@IsNotEmpty()
	@IsInt()
	@IsPositive()
	chatRoomID?: number;
}
