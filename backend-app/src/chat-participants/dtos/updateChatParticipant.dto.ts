import { IsBoolean, IsNotEmpty, IsNumber } from "class-validator";

export class updateParticipantDto {
    @IsBoolean()
    owner: boolean;

    @IsBoolean()
    operator: boolean;

    @IsBoolean()
    banned: boolean;

    @IsBoolean()
    muted: boolean;
}