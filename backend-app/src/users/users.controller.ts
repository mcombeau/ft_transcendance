import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserNotFoundException } from 'src/exceptions/not-found.exception';
import { createUsersDto } from 'src/users/dtos/createUsers.dto';
import { updateUsersDto } from 'src/users/dtos/updateUsers.dto';
import { UsersService } from 'src/users/users.service';
import { UserEntity } from './entities/user.entity';
import { ChatEntity } from 'src/chats/entities/chat.entity';
import { UpdateResult, DeleteResult } from 'typeorm';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOkResponse({
    type: UserEntity,
    description: 'Get user by ID.',
  })
  async getUserByID(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserEntity> {
    const user = await this.userService.fetchUserByID(id);
    if (!user) throw new UserNotFoundException(id.toString());
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/chats')
  @ApiOkResponse({
    type: ChatEntity,
    isArray: true,
    description: 'Get user chats (including DMs) by user ID.',
  })
  async getUserChatsByUserID(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ChatEntity[]> {
    return this.userService.fetchUserChatsByUserID(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/DMs')
  @ApiOkResponse({
    type: ChatEntity,
    isArray: true,
    description: 'Get user DM chats (only DMs) by user ID.',
  })
  async getUserChatDMsByUserID(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ChatEntity[]> {
    return this.userService.fetchUserChatDMsByUserID(id);
  }

  // @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOkResponse({
    type: UserEntity,
    isArray: true,
    description: 'Get all users.',
  })
  getUsers(): Promise<UserEntity[]> {
    return this.userService.fetchUsers();
  }

  @Post()
  @ApiCreatedResponse({ type: UserEntity, description: 'Record created.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  createUser(@Body() userDto: createUsersDto): Promise<UserEntity> {
    return this.userService.createUser(userDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiCreatedResponse({ type: UserEntity, description: 'Record updated.' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  async updateUserByID(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: updateUsersDto,
  ): Promise<UpdateResult> {
    return this.userService.updateUserByID(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Record deleted by ID.' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  async deleteUserByID(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteResult> {
    return this.userService.deleteUserByID(id);
  }
}
