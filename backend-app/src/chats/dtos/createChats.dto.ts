import { IsNotEmpty } from "class-validator";

export class createChatDto {
    @IsNotEmpty()
    name: string;
    
    @IsNotEmpty()
    password: string;
}