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
import { sendParticipantDto } from 'src/chat-participants/dtos/sendChatParticipant.dto';
import { UpdateResult, DeleteResult } from 'typeorm';
import { ChatMessageEntity } from 'src/chat-messages/entities/chat-message.entity';

@Controller('chats')
@UseGuards(JwtAuthGuard)
@ApiTags('chats')
export class ChatsController {
  constructor(private chatService: ChatsService) {}

  @Get('public')
  @ApiOkResponse({
    type: ChatEntity,
    isArray: true,
    description: 'Get public chats.',
  })
  getPublicChats(): Promise<ChatEntity[]> {
    return this.chatService.fetchPublicChats();
  }

  @Get(':id/participants')
  @ApiOkResponse({
    type: sendParticipantDto,
    isArray: true,
    description: 'Get chat participants by chat id.',
  })
  async getChatParticipantsByChatRoomID(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<sendParticipantDto[]> {
    return this.chatService.fetchChatParticipantsByID(id);
  }

  @Get(':id/messages')
  @ApiOkResponse({
    type: ChatMessageEntity,
    isArray: true,
    description: 'Get chat messages by chat id.',
  })
  async getChatMessagesByChatRoomID(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ChatMessageEntity[]> {
    return this.chatService.fetchChatRoomMessagesByID(id);
  }

  @Get(':id')
  @ApiOkResponse({ type: ChatEntity, description: 'Get chat by ID.' })
  async getChatByID(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ChatEntity> {
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
  getChats(): Promise<ChatEntity[]> {
    return this.chatService.fetchChats();
  }

  @Post()
  @ApiCreatedResponse({ type: ChatEntity, description: 'Record created.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  createChat(@Body() chatDto: createChatDto): Promise<ChatEntity> {
    return this.chatService.createChat(chatDto);
  }

  @Post('dm')
  @ApiCreatedResponse({ type: ChatEntity, description: 'Record created.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  createDM(@Body() chatDto: createChatDMDto): Promise<ChatEntity> {
    return this.chatService.createChatDM(chatDto);
  }

  @Patch(':id')
  @ApiCreatedResponse({ description: 'Record updated.' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  async updateChatByID(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChatDto: updateChatDto,
  ): Promise<UpdateResult> {
    return this.chatService.updateChatByID(id, updateChatDto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Record deleted by ID.' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  async deleteChatByID(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteResult> {
    return this.chatService.deleteChatByID(id);
  }
}
