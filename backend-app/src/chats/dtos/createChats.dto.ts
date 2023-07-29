import { ApiProperty } from '@nestjs/swagger';
import { IsAlpha, IsAlphanumeric, IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

export class createChatDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  private: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  owner: string;
}

export class createChatDMDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  private: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  user1: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  user2: string;
}

