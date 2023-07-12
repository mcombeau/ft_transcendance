import { IsAlphanumeric, IsNotEmpty, IsNumber } from 'class-validator';

export class createMessageDto {
  @IsNotEmpty()
  @IsAlphanumeric()
  message: string;
  @IsNotEmpty()
  @IsNumber()
  sender: number;
  @IsNotEmpty()
  @IsAlphanumeric()
  chatRoom: string;
}

