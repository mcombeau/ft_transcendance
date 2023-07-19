import { IsBoolean, IsNotEmpty, IsNumber } from "class-validator";

export class createParticipantDto {
    @IsNotEmpty()
    @IsNumber()
    userID: number;
    
    @IsNotEmpty()
    @IsNumber()
    chatRoomID: number;

    @IsBoolean()
    operator: boolean;

    @IsBoolean()
    banned: boolean;
}