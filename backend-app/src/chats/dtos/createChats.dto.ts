import { ApiProperty } from "@nestjs/swagger";
import {
	IsBoolean,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsPositive,
} from "class-validator";

export class createChatDto {
	@ApiProperty()
	@IsOptional()
	@IsNotEmpty()
	name: string;

	@ApiProperty()
	@IsOptional()
	@IsNotEmpty()
	@IsInt()
	@IsPositive()
	ownerID?: number;

	@ApiProperty()
	@IsOptional()
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
