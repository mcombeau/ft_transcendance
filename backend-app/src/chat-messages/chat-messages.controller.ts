import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ChatMessagesService } from './chat-messages.service';
import { createMessageDto } from './dtos/createMessage.dto';
import { ChatMessageNotFoundException } from 'src/exceptions/not-found.exception';
import { NotFoundInterceptor } from 'src/exceptions/not-found.interceptor';

// TODO: remove unecessary controller
@Controller('chat-messages')
export class ChatMessagesController {
  constructor(private readonly chatMessageService: ChatMessagesService) {}

  @Get()
  getAllMessages() {
    return this.chatMessageService.fetchMessages();
  }

  @Get(':id')
  async getMessageByID(@Param('id', ParseIntPipe) id: number) {
    const message = await this.chatMessageService.fetchMessage(id);
    if (!message)
      throw new ChatMessageNotFoundException(id.toString());
    return message;
  }

  @Post()
  createChatMessage(@Body() messageDto: createMessageDto) {
    return this.chatMessageService.createMessage(
      messageDto.message,
      messageDto.sender,
      messageDto.chatRoom,
      new Date(),
    );
  }

  @Delete(':id')
  async deleteMessageByID(@Param('id', ParseIntPipe) id: number) {
    await this.chatMessageService.deleteMessage(id);
  }
}
