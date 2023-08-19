import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { inviteType } from '../entities/Invite.entity';

export class createInviteDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(inviteType)
  type: inviteType;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @IsPositive()
  senderID: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @IsPositive()
  invitedUserID: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @IsPositive()
  chatRoomID: number;
}
