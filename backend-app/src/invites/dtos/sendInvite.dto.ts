import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { inviteType } from '../entities/Invite.entity';

export class sendInviteDto {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  @IsEnum(inviteType)
  type: inviteType;

  @ApiProperty()
  expiresAt?: number;

  @ApiProperty()
  senderID?: number;

  @ApiProperty()
  senderUsername?: string;

  @ApiProperty()
  invitedID?: number;

  @ApiProperty()
  invitedUsername?: string;

  @ApiProperty()
  chatRoomID?: number;

  @ApiProperty()
  chatRoomName?: string;

  @ApiProperty()
  chatHasPassword?: boolean;
  // @ApiProperty()
  // gameRoomID: number;
}
