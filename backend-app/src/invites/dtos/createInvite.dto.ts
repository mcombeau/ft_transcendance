import { ApiProperty } from '@nestjs/swagger';
import { IsAlphanumeric, IsBoolean, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { inviteType } from '../entities/Invite.entity';

export class createInviteDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  type: string;
  // TODO [mcombeau]: Replace this
  // @IsEnum(inviteType)
  // type: inviteType;

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
