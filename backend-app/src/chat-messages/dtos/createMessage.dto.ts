import { IsAlphanumeric, IsNotEmpty, IsNumber } from "class-validator";

export class createMessageDto {
    @IsNotEmpty()
    @IsAlphanumeric()
    message: string;

    @IsNotEmpty()
    @IsNumber()
    senderID: number;

    @IsNotEmpty()
    @IsNumber()
    chatID: number;
}