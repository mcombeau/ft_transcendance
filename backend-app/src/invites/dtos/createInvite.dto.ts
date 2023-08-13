import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

export class createInviteDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  invitedUserID: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  chatRoomID: number;

  @ApiProperty()
  @IsNumber()
  invitedUntil: bigint;
}
