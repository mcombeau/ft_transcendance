import { ApiProperty } from "@nestjs/swagger";
import { IsAlphanumeric, IsBoolean, IsInt, IsOptional, IsPositive, Length } from "class-validator";

export class updateChatDto {
    @ApiProperty()
    @IsOptional()
    @IsAlphanumeric()
    @Length(3, 20)
    name?: string;

    @ApiProperty()
    @IsOptional()
    @IsAlphanumeric()
    @Length(10, 20)
    password?: string;

    @ApiProperty()
    @IsOptional()
    @IsBoolean()
    private?: boolean;

    @ApiProperty()
    @IsOptional()
    @IsInt()
    @IsPositive()
    participantID?: number;
}