import {ApiProperty} from '@nestjs/swagger';
import {IsBoolean, IsNumber, IsOptional} from 'class-validator';

export class updateParticipantDto {
	@ApiProperty()
	@IsOptional()
	@IsBoolean()
	isOwner?: boolean;

	@ApiProperty()
	@IsBoolean()
	@IsOptional()
	isOperator?: boolean;

	@ApiProperty()
	@IsOptional()
	@IsBoolean()
	isBanned?: boolean;

	@ApiProperty()
	@IsOptional()
	@IsNumber()
	mutedUntil?: number;
}
