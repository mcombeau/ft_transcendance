import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsPositive } from "class-validator";

export class updateChatDto {
	@ApiProperty()
	@IsOptional()
	name?: string;

	@ApiProperty()
	@IsOptional()
	password?: string;

	@ApiProperty()
	@IsOptional()
	@IsBoolean()
	isPrivate?: boolean;

	@ApiProperty()
	@IsOptional()
	@IsInt()
	@IsPositive()
	participantID?: number;
}
