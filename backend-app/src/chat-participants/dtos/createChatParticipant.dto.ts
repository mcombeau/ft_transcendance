import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

export class createParticipantDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userID: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
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
  mutedUntil: bigint;
}
