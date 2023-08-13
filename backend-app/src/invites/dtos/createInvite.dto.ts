import { ApiProperty } from '@nestjs/swagger';
import { IsAlphanumeric, IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

export class createInviteDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  type: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  senderUsername: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  invitedUsername: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  chatRoomName: string;
}
