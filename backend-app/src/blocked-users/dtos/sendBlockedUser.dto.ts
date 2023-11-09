import { ApiProperty } from '@nestjs/swagger';

export class sendBlockedUserDto {
  @ApiProperty()
  blockingUserID: number;

  @ApiProperty()
  blockingUsername: string;

  @ApiProperty()
  blockingUserStatus: string;

  @ApiProperty()
  blockedUserID: number;

  @ApiProperty()
  blockedUsername: string;

  @ApiProperty()
  blockedUserStatus: string;
}
