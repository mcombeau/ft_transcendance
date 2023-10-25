import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsAlphanumeric,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

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
}
