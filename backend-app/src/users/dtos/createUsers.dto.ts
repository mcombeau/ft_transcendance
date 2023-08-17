import { ApiProperty } from '@nestjs/swagger';
import {
  IsAlphanumeric,
  IsEmail,
  IsEmpty,
  IsNotEmpty,
  IsOptional,
  isAlphanumeric,
} from 'class-validator';

export class createUsersDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  username: string;

  @ApiProperty()
  @IsOptional()
  @IsAlphanumeric()
  login42: string;

  @ApiProperty()
  @IsAlphanumeric()
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

