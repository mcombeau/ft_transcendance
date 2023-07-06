import { IsAlphanumeric, IsNotEmpty, IsNumber } from "class-validator";

export class createMessageDto {
    @IsNotEmpty()
    @IsAlphanumeric()
    message: string;
    @IsNotEmpty()
    @IsNumber()
    sender: number;
    @IsNotEmpty()
    @IsNumber()
    chatRoom: number;
}