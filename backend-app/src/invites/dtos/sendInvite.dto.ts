import {ApiProperty} from '@nestjs/swagger';
import {
	IsEnum,
	IsOptional,
	IsString,
	IsInt,
	IsBoolean,
	IsNumber,
} from 'class-validator';
import {inviteType} from '../entities/Invite.entity';

export class sendInviteDto {
	@ApiProperty()
	@IsOptional()
	@IsInt()
	id?: number;

	@ApiProperty()
	@IsEnum(inviteType)
	type: inviteType;

	@ApiProperty()
	@IsOptional()
	expiresAt?: number;

	@ApiProperty()
	@IsOptional()
	@IsInt()
	senderID?: number;

	@ApiProperty()
	@IsOptional()
	@IsString()
	senderUsername?: string;

	@ApiProperty()
	@IsOptional()
	@IsInt()
	invitedID?: number;

	@ApiProperty()
	@IsOptional()
	invitedUsername?: string;

	@ApiProperty()
	@IsOptional()
	@IsInt()
	chatRoomID?: number;

	@ApiProperty()
	@IsOptional()
	@IsString()
	chatRoomName?: string;

	@ApiProperty()
	@IsOptional()
	@IsBoolean()
	chatHasPassword?: boolean;
	// @ApiProperty()
	// gameRoomID: number;
}
