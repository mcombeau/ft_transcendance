import { ApiProperty } from "@nestjs/swagger";
import { IsAlphanumeric, IsNotEmpty, IsNumber } from "class-validator";
import { UserEntity } from "src/users/entities/user.entity";

export class highScoreDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsAlphanumeric()
    username: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    highScore: number;
}