import { ApiProperty } from '@nestjs/swagger';
import {
  IsAlphanumeric,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class createUsersDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsAlphanumeric()
  @Length(3, 15)
  username: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsAlphanumeric()
  @Length(3, 15)
  login42?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsAlphanumeric()
  @Length(3, 20)
  password?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

