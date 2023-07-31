import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

export class createParticipantDto {
  @IsNotEmpty()
  @IsNumber()
  userID: number;

  @IsNotEmpty()
  @IsNumber()
  chatRoomID: number;

  @IsBoolean()
  owner: boolean;

  @IsBoolean()
  operator: boolean;

  @IsBoolean()
  banned: boolean;

  @IsNumber()
  mutedUntil: bigint;

  @IsNumber()
  invitedUntil: bigint;
}
