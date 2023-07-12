import { IsNotEmpty, IsNumber } from "class-validator";

export class createGameDto {
    @IsNotEmpty()
    @IsNumber()
    winnerID: number;
    @IsNotEmpty()
    @IsNumber()
    loserID: number;
    @IsNotEmpty()
    @IsNumber()
    winnerScore: number;
    @IsNotEmpty()
    @IsNumber()
    loserScore: number;
}