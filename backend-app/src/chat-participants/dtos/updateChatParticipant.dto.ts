import { IsBoolean, IsNotEmpty, IsNumber } from "class-validator";

export class updateParticipantDto {
    @IsBoolean()
    operator: boolean;

    @IsBoolean()
    banned: boolean;
}