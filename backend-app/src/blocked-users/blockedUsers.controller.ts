import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
import { DeleteResult } from 'typeorm';
import { BlockedUsersService } from 'src/blocked-users/blockedUsers.service';
import { sendBlockedUserDto } from 'src/blocked-users/dtos/sendBlockedUser.dto';
import { createBlockedUserDto } from 'src/blocked-users/dtos/createBlockedUser.dto';
import { updateBlockedUserDto } from 'src/blocked-users/dtos/updateBlockedUser.dto';
import { BlockedUserEntity } from 'src/blocked-users/entities/BlockedUser.entity';

@UseGuards(JwtAuthGuard)
@ApiTags('blocked users')
@Controller('blocked-users')
export class BlockedUsersController {
  constructor(private blockedUserService: BlockedUsersService) {}

  @Post('isUserBlocked')
  @ApiOkResponse({
    type: sendBlockedUserDto,
    description: 'Get one blockedUser relationship.',
  })
  getOneBlockedUserByUserIDs(
    @Body() blockedUserDto: createBlockedUserDto,
  ): Promise<sendBlockedUserDto> {
    return this.blockedUserService.fetchBlockedUserByUserIDs(
      blockedUserDto.blockingUserID,
      blockedUserDto.blockedUserID,
    );
  }

  @Get(':id')
  @ApiOkResponse({
    type: sendBlockedUserDto,
    description: 'Get blockedUser relationship by ID.',
  })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  getBlockedUserByID(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<sendBlockedUserDto> {
    return this.blockedUserService.fetchBlockedUserByID(id);
  }

  @Get()
  @ApiOkResponse({
    type: sendBlockedUserDto,
    isArray: true,
    description: 'Get all blockedUser relationships.',
  })
  getAllBlockedUsers(): Promise<sendBlockedUserDto[]> {
    return this.blockedUserService.fetchBlockedUsers();
  }

  @Post()
  @ApiCreatedResponse({
    type: BlockedUserEntity,
    description: 'Record created.',
  })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  createBlockedUser(
    @Body() blockedUserDto: createBlockedUserDto,
  ): Promise<BlockedUserEntity> {
    return this.blockedUserService.createBlockedUser(blockedUserDto);
  }

  @Delete()
  @ApiOkResponse({ description: 'Record deleted by user IDs.' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  deleteBlockedUserByUserIDs(
    @Body() updateBlockedUserDto: updateBlockedUserDto,
  ): Promise<DeleteResult> {
    return this.blockedUserService.deleteBlockedUserByUserIDs(
      updateBlockedUserDto,
    );
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Record deleted by ID.' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  deleteBlockedUserByID(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteResult> {
    return this.blockedUserService.deleteBlockedUserByID(id);
  }
}
