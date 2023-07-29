import { ApiProperty } from "@nestjs/swagger";

export class updateUsersDto {
    @ApiProperty()
    username: string;

    @ApiProperty()
    email: string;
}