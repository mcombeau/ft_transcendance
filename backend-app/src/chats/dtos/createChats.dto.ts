import {ApiProperty} from '@nestjs/swagger';
import {
	IsAlphanumeric,
	IsBoolean,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsPositive,
	Length,
} from 'class-validator';

export class createChatDto {
	@ApiProperty()
	@IsOptional()
	@IsNotEmpty()
	@IsAlphanumeric()
	@Length(3, 20)
	name: string;

	@ApiProperty()
	@IsOptional()
	@IsNotEmpty()
	@IsInt()
	@IsPositive()
	ownerID?: number;

	@ApiProperty()
	@IsOptional()
	@Length(3, 20)
	@IsAlphanumeric()
	password?: string;

	@ApiProperty()
	@IsOptional()
	@IsNotEmpty()
	@IsBoolean()
	isPrivate?: boolean;

	@ApiProperty()
	@IsOptional()
	@IsNotEmpty()
	@IsBoolean()
	isDirectMessage?: boolean;

	@ApiProperty()
	@IsOptional()
	@IsNotEmpty()
	@IsBoolean()
	hasPassword?: boolean;
}

export class createChatDMDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsInt()
	@IsPositive()
	userID1: number;

	@ApiProperty()
	@IsNotEmpty()
	@IsInt()
	@IsPositive()
	userID2: number;
}
