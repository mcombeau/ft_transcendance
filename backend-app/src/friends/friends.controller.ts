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
import { DeleteResult, UpdateResult } from 'typeorm';
import { FriendsService } from 'src/friends/friends.service';
import { sendFriendDto } from 'src/friends/dtos/sendFriend.dto';
import { createFriendDto } from 'src/friends/dtos/createFriend.dto';
import { updateFriendDto } from 'src/friends/dtos/updateFriend.dto';
import { FriendEntity } from 'src/friends/entities/Friend.entity';

@UseGuards(JwtAuthGuard)
@ApiTags('friends')
@Controller('friends')
export class FriendsController {
  constructor(private friendService: FriendsService) {}

  @Post('friend')
  @ApiOkResponse({
    type: sendFriendDto,
    description: 'Get one friend relationship.',
  })
  getOneFriendByUserIDs(
    @Body() friendDto: createFriendDto,
  ): Promise<sendFriendDto> {
    return this.friendService.fetchFriendByUserIDs(
      friendDto.userID1,
      friendDto.userID2,
    );
  }

  @Get(':id')
  @ApiOkResponse({
    type: sendFriendDto,
    description: 'Get friend relationship by ID.',
  })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  getFriendByID(@Param('id', ParseIntPipe) id: number): Promise<sendFriendDto> {
    return this.friendService.fetchFriendByID(id);
  }

  @Get()
  @ApiOkResponse({
    type: sendFriendDto,
    isArray: true,
    description: 'Get all friend relationships.',
  })
  getAllFriends(): Promise<sendFriendDto[]> {
    return this.friendService.fetchFriends();
  }

  @Post()
  @ApiCreatedResponse({
    type: FriendEntity,
    description: 'Record created.',
  })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  createFriend(@Body() friendDto: createFriendDto): Promise<FriendEntity> {
    return this.friendService.createFriend(friendDto);
  }

  @Patch(':id')
  @ApiCreatedResponse({ description: 'Record updated.' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  async updateFriendByID(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFriendDto: updateFriendDto,
  ): Promise<UpdateResult> {
    return this.friendService.updateFriendByID(id, updateFriendDto);
  }

  @Delete()
  @ApiOkResponse({ description: 'Record deleted by user IDs.' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  deleteFriendByUserIDs(
    @Body() updateFriendDto: updateFriendDto,
  ): Promise<DeleteResult> {
    return this.friendService.deleteFriendByUserIDs(updateFriendDto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Record deleted by ID.' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  deleteFriendByID(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteResult> {
    return this.friendService.deleteFriendByID(id);
  }
}
