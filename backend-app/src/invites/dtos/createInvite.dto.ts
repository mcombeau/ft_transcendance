import { ApiProperty } from '@nestjs/swagger';
import { IsAlphanumeric, IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

export class createInviteDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  type: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  senderID: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  invitedUserID: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  chatRoomID: number;
}
