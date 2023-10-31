import { ApiProperty } from '@nestjs/swagger';

export class sendGameDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  winnerID: number;

  @ApiProperty()
  winnerUsername: string;

  @ApiProperty()
  loserID: number;

  @ApiProperty()
  loserUsername: string;

  @ApiProperty()
  winnerScore: number;

  @ApiProperty()
  loserScore: number;

  @ApiProperty()
  createdAt: Date;
}
