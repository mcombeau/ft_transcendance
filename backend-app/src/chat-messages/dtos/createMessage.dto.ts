import { IsAlphanumeric, IsNotEmpty } from "class-validator";

export class createMessageDto {
    @IsNotEmpty()
    @IsAlphanumeric()
    message: string;
}