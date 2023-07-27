import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { createChatDMDto, createChatDto } from './dtos/createChats.dto';
import { updateChatDto } from './dtos/updateChats.dto';
import { ChatNotFoundException } from 'src/exceptions/not-found.exception';

@Controller('chats')
export class ChatsController {
  constructor(private chatService: ChatsService) {}

  @Get(':name')
  async getChatByName(@Param('name') name: string) {
    const chat = await this.chatService.fetchChatByName(name);
    if (!chat)
      throw new ChatNotFoundException(name);
    return chat;
  }

  @Get(':id')
  async getChatByID(@Param('id', ParseIntPipe) id: number) {
    const chat = await this.chatService.fetchChatByID(id);
    if (!chat)
      throw new ChatNotFoundException(id.toString());
    return chat;
  }

  @Get()
  getChats() {
    return this.chatService.fetchChats();
  }

  @Post()
  createChat(@Body() chatDto: createChatDto) {
    return this.chatService.createChat(chatDto);
  }

  @Post('dm')
  createDM(@Body() chatDto: createChatDMDto) {
    return this.chatService.createChatDM(chatDto);
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
