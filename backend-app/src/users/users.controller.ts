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
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { UserNotFoundException } from 'src/exceptions/not-found.exception';
import { createUsersDto } from 'src/users/dtos/createUsers.dto';
import { updateUsersDto } from 'src/users/dtos/updateUsers.dto';
import { UsersService } from 'src/users/users.service';
import { UserEntity } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  
  @Get('/username/:username')
  @ApiOkResponse({
    type: UserEntity,
    description: 'Get user by username.',
  })
  async getUserByUsername(@Param('username') username: string) {
    const user = await this.userService.fetchUserByUsername(username);
    if (!user)
      throw new UserNotFoundException(username);
    return user;
  }

  @Get(':id')
  @ApiOkResponse({
    type: UserEntity,
    description: 'Get user by ID.',
  })
  async getUserByID(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.fetchUserByID(id);
    if (!user)
      throw new UserNotFoundException(id.toString());
    return user;
  }

  @Get()
  @ApiOkResponse({ type: UserEntity, isArray: true, description: 'Get all users.' })
  getUsers() {
    return this.userService.fetchUsers();
  }

  @Post()
  @ApiCreatedResponse({ type: UserEntity, description: 'Record created.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiUnprocessableEntityResponse({ description: 'Database error. (Unprocessable entity)' })
  @UsePipes(new ValidationPipe())
  createUser(@Body() userDto: createUsersDto) {
    return this.userService.createUser(userDto);
  }
 
  @Patch(':id')
  @ApiCreatedResponse({ type: UserEntity, description: 'Record updated.' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnprocessableEntityResponse({ description: 'Database error. (Unprocessable entity)' })
  async updateUserByID(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: updateUsersDto,
  ) {
    await this.userService.updateUserByID(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Record deleted by ID.' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnprocessableEntityResponse({ description: 'Database error. (Unprocessable entity)' })
  async deleteUserByID(@Param('id', ParseIntPipe) id: number) {
    await this.userService.deleteUserByID(id);
  }
}
