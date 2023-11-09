import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsAlphanumeric,
  IsOptional,
  IsString,
  IsEnum,
  Length,
} from 'class-validator';
import { userStatus } from 'src/users/entities/user.entity';

export class updateUsersDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsAlphanumeric()
  @Length(3, 15)
  username?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsAlphanumeric()
  @Length(3, 20)
  currentPassword?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsAlphanumeric()
  @Length(3, 20)
  newPassword?: string;

  @ApiProperty()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(userStatus)
  status?: userStatus;
}
