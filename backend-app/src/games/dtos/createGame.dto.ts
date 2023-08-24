import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class createGameDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  winnerID: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  loserID: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  winnerScore: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  loserScore: number;
}

