import { ApiProperty } from '@nestjs/swagger';

export class updateUsersDto {
  username: string;

  @ApiProperty()
  password: string;

  @ApiProperty()
  email: string;
}
