import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserNotFoundException } from 'src/exceptions/not-found.exception';
import { createUsersDto } from 'src/users/dtos/createUsers.dto';
import { updateUsersDto } from 'src/users/dtos/updateUsers.dto';
import { UsersService } from 'src/users/users.service';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  
  @Get('/username/:username')
  async getUserByUsername(@Param('username') username: string) {
    const user = await this.userService.fetchUserByUsername(username);
    if (!user)
      throw new UserNotFoundException(username);
    return user;
  }

  @Get(':id')
  async getUserByID(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.fetchUserByID(id);
    if (!user)
      throw new UserNotFoundException(id.toString());
    return user;
  }

  @Get()
  getUsers() {
    return this.userService.fetchUsers();
  }

  @Post()
  @UsePipes(new ValidationPipe())
  createUser(@Body() userDto: createUsersDto) {
    return this.userService.createUser(userDto);
  }
 
  @Patch(':id')
  async updateUserByID(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: updateUsersDto,
  ) {
    await this.userService.updateUserByID(id, updateUserDto);
  }

  @Delete(':id')
  async deleteUserByID(@Param('id', ParseIntPipe) id: number) {
    await this.userService.deleteUserByID(id);
  }
}
