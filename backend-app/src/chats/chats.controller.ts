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
import { ChatsService } from './chats.service';
import { createChatDMDto, createChatDto } from './dtos/createChats.dto';
import { ChatNotFoundException } from 'src/exceptions/not-found.exception';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ChatEntity } from './entities/chat.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { updateChatDto } from './dtos/updateChats.dto';
import { ChatParticipantEntity } from 'src/chat-participants/entities/chat-participant.entity';

@Controller('chats')
@UseGuards(JwtAuthGuard)
@ApiTags('chats')
export class ChatsController {
  constructor(private chatService: ChatsService) {}

  @Get(':name')
  @ApiOkResponse({ type: ChatEntity, description: 'Get chat by name.' })
  async getChatByName(@Param('name') name: string) {
    const chat = await this.chatService.fetchChatByName(name);
    if (!chat) throw new ChatNotFoundException(name);
    return chat;
  }

  @Get(':id/participants')
  @ApiOkResponse({
    type: ChatParticipantEntity,
    isArray: true,
    description: 'Get chat participants by chat id.',
  })
  async getChatParticipantsByChatRoomID(@Param('id', ParseIntPipe) id: number) {
    return this.chatService.fetchChatParticipantsByID(id);
  }

  @Get(':name/usernames')
  // TODO [mcombeau]: figure out exported type for @apiokresponse
  async getChatUsersByChatName(@Param('name') name: string) {
    const participants =
      await this.chatService.fetchParticipantUsernamesByChatName(name);
    if (!participants) throw new ChatNotFoundException(name);
    return participants;
  }

  @Get(':id')
  @ApiOkResponse({ type: ChatEntity, description: 'Get chat by ID.' })
  async getChatByID(@Param('id', ParseIntPipe) id: number) {
    const chat = await this.chatService.fetchChatByID(id);
    if (!chat) throw new ChatNotFoundException(id.toString());
    return chat;
  }

  @Get()
  @ApiOkResponse({
    type: ChatEntity,
    isArray: true,
    description: 'Get all chats.',
  })
  getChats() {
    return this.chatService.fetchChats();
  }

  @Get('public')
  @ApiOkResponse({
    type: ChatEntity,
    isArray: true,
    description: 'Get public chats.',
  })
  getPublicChats() {
    return this.chatService.fetchPublicChats();
  }

  @Post()
  @ApiCreatedResponse({ type: ChatEntity, description: 'Record created.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  createChat(@Body() chatDto: createChatDto) {
    return this.chatService.createChat(chatDto);
  }

  @Post('dm')
  @ApiCreatedResponse({ type: ChatEntity, description: 'Record created.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  createDM(@Body() chatDto: createChatDMDto) {
    return this.chatService.createChatDM(chatDto);
  }

  @Patch(':id')
  @ApiCreatedResponse({ type: ChatEntity, description: 'Record updated.' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  async updateChatByID(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChatDto: updateChatDto,
  ) {
    await this.chatService.updateChatByID(id, updateChatDto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Record deleted by ID.' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  async deleteChatByID(@Param('id', ParseIntPipe) id: number) {
    await this.chatService.deleteChatByID(id);
  }
}
