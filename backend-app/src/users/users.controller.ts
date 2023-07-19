import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { createUsersDto } from 'src/users/dtos/createUsers.dto';
import { updateUsersDto } from 'src/users/dtos/updateUsers.dto';
import { UsersService } from 'src/users/users.service';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Get(':username')
  async getUserByUsername(@Param('username') username: string) {
    const user = await this.userService.fetchUserByUsername(username);
    if (!user)
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    return user;
  }

  @Get(':id')
  async getUserByID(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.fetchUserByID(id);
    if (!user)
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    return user;
  }

  @Get()
  getUsers() {
    return this.userService.fetchUsers();
  }

  @Post()
  @UsePipes(new ValidationPipe())
  createUser(@Body() userDto: createUsersDto) {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!');
    console.log('A user has been posted');
    console.log(userDto);
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
