import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ChatMessagesService } from './chat-messages.service';
import { createMessageDto } from './dtos/createMessage.dto';
import { ChatMessageNotFoundException } from 'src/exceptions/not-found.exception';
import { NotFoundInterceptor } from 'src/exceptions/not-found.interceptor';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

// TODO: remove unecessary controller
@UseGuards(JwtAuthGuard)
@Controller('chat-messages')
export class ChatMessagesController {
  constructor(private readonly chatMessageService: ChatMessagesService) {}

  @Get(':id')
  async getMessageByID(@Param('id', ParseIntPipe) id: number) {
    const message = await this.chatMessageService.fetchMessage(id);
    if (!message) throw new ChatMessageNotFoundException(id.toString());
    return message;
  }

  @Get()
  @ApiOkResponse({
    type: ChatMessageEntity,
    isArray: true,
    description: 'Get all chat messages.',
  })
  getAllMessages() {
    return this.chatMessageService.fetchMessages();
  }

  @Post()
  @ApiCreatedResponse({
    type: ChatMessageEntity,
    description: 'Record created.',
  })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
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
