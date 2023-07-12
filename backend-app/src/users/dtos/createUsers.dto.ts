import { IsEmail, IsEmpty, IsNotEmpty } from "class-validator";

export class createUsersDto {
    @IsNotEmpty()
    username: string;
    
    @IsNotEmpty()
    @IsEmail()
    email: string;
}