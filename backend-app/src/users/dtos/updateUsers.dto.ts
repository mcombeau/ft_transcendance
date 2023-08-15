import { ApiProperty } from "@nestjs/swagger";

export class updateUsersDto {
    @ApiProperty()
    username: string;

    @ApiProperty()
    password: string;

    @ApiProperty()
    email: string;
}