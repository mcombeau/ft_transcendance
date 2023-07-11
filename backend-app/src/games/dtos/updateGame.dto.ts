import { IsNotEmpty } from "class-validator";

export class updateGameDto {
    @IsNotEmpty()
    winner: string;
    @IsNotEmpty()
    loser: string;
    @IsNotEmpty()
    winnerScore: number;
    @IsNotEmpty()
    loserScore: number;
}