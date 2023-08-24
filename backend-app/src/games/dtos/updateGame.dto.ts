import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class updateGameDto {
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

