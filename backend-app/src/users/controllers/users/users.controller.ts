import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { createUsersDto } from 'src/users/dtos/createUsers.dto';
import { updateUsersDto } from 'src/users/dtos/updateUsers.dto';
import { UsersService } from 'src/users/services/users/users.service';

@Controller('users')
export class UsersController {
    constructor(private userService: UsersService) {}

    @Get()
    getUsers() {
        return this.userService.fetchUsers();
    }

    @Post()
    createUser(@Body() userDto: createUsersDto) {
        return this.userService.createUser(userDto);
    }

    @Patch(':id')
    async updateUserByID(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: updateUsersDto) {
        await this.userService.updateUser(id, updateUserDto);
    }

    @Delete(':id')
    async deleteUserByID(@Param('id', ParseIntPipe) id: number) {
        await this.userService.deleteUser(id);
    }
}
