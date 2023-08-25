import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class createParticipantDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  userID: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  chatRoomID: number;

  @ApiProperty()
  @IsBoolean()
  owner: boolean;

  @ApiProperty()
  @IsBoolean()
  operator: boolean;

  @ApiProperty()
  @IsBoolean()
  banned: boolean;

  @ApiProperty()
  @IsNumber()
  mutedUntil: number;
}

export class sendParticipantDto {
  @ApiProperty()
  userID: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  chatRoomID: number;

  @ApiProperty()
  isOwner: boolean;

  @ApiProperty()
  isOperator: boolean;

  @ApiProperty()
  isBanned: boolean;

  @ApiProperty()
  isMutedUntil: number;
}
