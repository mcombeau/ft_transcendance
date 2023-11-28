import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, IsEnum } from "class-validator";
import { userStatus } from "src/users/entities/user.entity";

export class updateUsersDto {
	@ApiProperty()
	@IsOptional()
	@IsString()
	username?: string;

	@ApiProperty()
	@IsOptional()
	@IsString()
	currentPassword?: string;

	@ApiProperty()
	@IsOptional()
	@IsString()
	newPassword?: string;

	@ApiProperty()
	@IsOptional()
	@IsEmail()
	email?: string;

	@ApiProperty()
	@IsOptional()
	avatarUrl?: string;

	@ApiProperty()
	@IsOptional()
	@IsEnum(userStatus)
	status?: userStatus;
}
