import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export class updateGameDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    winnerID: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    loserID: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    winnerScore: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    loserScore: number;
}