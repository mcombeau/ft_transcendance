import { IsNotEmpty } from "class-validator";

export class createGameDto {
    @IsNotEmpty()
    winner: string;
    @IsNotEmpty()
    loser: string;
    @IsNotEmpty()
    winnerScore: number;
    @IsNotEmpty()
    loserScore: number;
}