import { ApiProperty } from '@nestjs/swagger';
import { IsAlphanumeric, IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, Length } from 'class-validator';

export class createChatDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  @Length(3, 20)
  name: string;

  @ApiProperty()
  @IsOptional()
  @IsAlphanumeric()
  @Length(3, 20)
  password?: string;

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
  @IsInt()
  @IsPositive()
  ownerID: number;
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

