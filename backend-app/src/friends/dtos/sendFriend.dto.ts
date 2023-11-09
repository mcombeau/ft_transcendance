import { ApiProperty } from '@nestjs/swagger';

export class sendFriendDto {
  @ApiProperty()
  userID1: number;

  @ApiProperty()
  username1: string;

  @ApiProperty()
  userStatus1: string;

  @ApiProperty()
  userID2: number;

  @ApiProperty()
  username2: string;

  @ApiProperty()
  userStatus2: string;
}
