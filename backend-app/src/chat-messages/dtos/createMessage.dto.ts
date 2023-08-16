import { IsAlphanumeric, IsNotEmpty, IsNumber } from 'class-validator';

export class createMessageDto {
  @IsNotEmpty()
  @IsAlphanumeric()
  message: string;
  @IsNotEmpty()
  @IsAlphanumeric()
  sender: string;
  @IsNotEmpty()
  @IsAlphanumeric()
  chatRoom: string;
}
