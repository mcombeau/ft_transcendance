import { ApiProperty } from '@nestjs/swagger';
import {
  IsAlphanumeric,
  IsEmail,
  IsEmpty,
  IsNotEmpty,
  isAlphanumeric,
} from 'class-validator';

export class createUsersDto {
  @IsNotEmpty()
  @IsAlphanumeric()
  username: string;

  @ApiProperty()
  @IsAlphanumeric()
  password: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}

