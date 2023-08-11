import { ApiProperty } from "@nestjs/swagger";
import { IsAlphanumeric, IsNotEmpty, IsNumber, isAlphanumeric } from "class-validator";

export class updateGameDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsAlphanumeric()
    winnerName: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsAlphanumeric()
    loserName: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    winnerScore: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    loserScore: number;
}