import { ApiProperty } from "@nestjs/swagger";

export class updateChatDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    password: string;

    @ApiProperty()
    private: boolean;

    @ApiProperty()
    participantID: number;
}