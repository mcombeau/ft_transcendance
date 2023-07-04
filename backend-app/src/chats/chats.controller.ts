import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { createChatDto } from './dtos/createChats.dto';
import { updateChatDto } from './dtos/updateChats.dto';

@Controller('chats')
export class ChatsController {
    constructor(private chatService: ChatsService) {}

    @Get()
    getChats() {
        return this.chatService.fetchChats();
    }

    @Post('create')
    createChat(@Body() chatDto: createChatDto) {
        return this.chatService.createChat(chatDto);
    }

    @Get(':id')
    async getChatByID(@Param('id', ParseIntPipe) id: number) {
        const chat = await this.chatService.fetchChat(id);
        if (!chat)
            throw new HttpException("Chat not found", HttpStatus.BAD_REQUEST);
        return chat;
    }

    @Patch(':id')
    async updateChatByID(@Param('id', ParseIntPipe) id: number, @Body() updateChatDto: updateChatDto) {
        await this.chatService.updateChat(id, updateChatDto);
    }

    @Delete(':id')
    async deleteChatByID(@Param('id', ParseIntPipe) id: number) {
        await this.chatService.deleteChat(id);
    }
}
