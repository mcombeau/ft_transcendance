import {ApiProperty} from '@nestjs/swagger';
import {
	IsInt,
	IsNotEmpty,
	IsPositive,
} from 'class-validator';

export class createFriendDto {
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
