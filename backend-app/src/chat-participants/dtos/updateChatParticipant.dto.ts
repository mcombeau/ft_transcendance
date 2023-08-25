import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber } from 'class-validator';

export class updateParticipantDto {
  @ApiProperty()
  @IsBoolean()
  isOwner?: boolean;

  @ApiProperty()
  @IsBoolean()
  isOperator?: boolean;

  @ApiProperty()
  @IsBoolean()
  isBanned?: boolean;

  @ApiProperty()
  @IsNumber()
  mutedUntil?: number;
}
