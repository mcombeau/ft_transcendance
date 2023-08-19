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
  @IsBoolean()
  directMessage: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  ownerID: number;
}

export class createChatDMDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userID1: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userID2: number;
}

