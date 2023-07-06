import { IsAlpha, IsAlphanumeric, IsNotEmpty } from "class-validator";

export class createChatDto {
    @IsNotEmpty()
    @IsAlphanumeric()
    name: string;
    
    @IsNotEmpty()
    @IsAlphanumeric()
    password: string;
}