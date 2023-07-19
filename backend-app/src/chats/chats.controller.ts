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
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { createChatDto } from './dtos/createChats.dto';
import { updateChatDto } from './dtos/updateChats.dto';
import { createMessageDto } from 'src/chat-messages/dtos/createMessage.dto';

@Controller('chats')
export class ChatsController {
  constructor(private chatService: ChatsService) {}

  @Get()
  getChats() {
    return this.chatService.fetchChats();
  }

  @Post()
  createChat(@Body() chatDto: createChatDto) {
    return this.chatService.createChat(chatDto);
  }

  @Get(':id')
  async getChatByID(@Param('id', ParseIntPipe) id: number) {
    const chat = await this.chatService.fetchChatByID(id);
    if (!chat)
      throw new HttpException('Chat not found', HttpStatus.BAD_REQUEST);
    return chat;
  }

  @Get(':name')
  async getChatByName(@Param('name') name: string) {
    const chat = await this.chatService.fetchChatByName(name);
    if (!chat)
      throw new HttpException('Chat not found', HttpStatus.BAD_REQUEST);
    return chat;
  }

  @Patch(':id')
  async updateChatByID(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChatDto: updateChatDto,
  ) {
    await this.chatService.updateChatByID(id, updateChatDto);
  }

  @Delete(':id')
  async deleteChatByID(@Param('id', ParseIntPipe) id: number) {
    await this.chatService.deleteChatByID(id);
  }
}
