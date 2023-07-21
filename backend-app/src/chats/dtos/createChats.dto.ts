import { IsAlpha, IsAlphanumeric, IsNotEmpty, IsNumber } from "class-validator";

export class createChatDto {
    @IsNotEmpty()
    @IsAlphanumeric()
    name: string;
    
    @IsNotEmpty()
    @IsAlphanumeric()
    password: string;

    @IsNotEmpty()
    @IsNumber()
    ownerID: number;
}