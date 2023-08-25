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
import { ChatParticipantsService } from './chat-participants.service';
import { createParticipantDto } from './dtos/createChatParticipant.dto';
import { updateParticipantDto } from './dtos/updateChatParticipant.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ChatParticipantEntity } from './entities/chat-participant.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { sendParticipantDto } from './dtos/sendChatParticipant.dto';
import { DeleteResult, UpdateResult } from 'typeorm';

@UseGuards(JwtAuthGuard)
@ApiTags('chat participants')
@Controller('chat-participants')
export class ChatParticipantsController {
  constructor(private participantService: ChatParticipantsService) {}

  @Get(':id')
  @ApiOkResponse({
    type: ChatParticipantEntity,
    description: 'Get chat participant by ID.',
  })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  getParticipantByID(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<sendParticipantDto> {
    return this.participantService.fetchParticipantByID(id);
  }

  @Get()
  @ApiOkResponse({
    type: ChatParticipantEntity,
    isArray: true,
    description: 'Get all chat participants.',
  })
  getAllParticipants(): Promise<sendParticipantDto[]> {
    return this.participantService.fetchParticipants();
  }

  @Post()
  @ApiCreatedResponse({
    type: ChatParticipantEntity,
    description: 'Record created.',
  })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  createParticipant(
    @Body() participantDto: createParticipantDto,
  ): Promise<ChatParticipantEntity> {
    return this.participantService.createChatParticipant(participantDto);
  }

  @Patch(':id')
  @ApiCreatedResponse({
    type: ChatParticipantEntity,
    description: 'Record updated.',
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  async updateParticipantByID(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateParticipantDto: updateParticipantDto,
  ): Promise<UpdateResult> {
    return this.participantService.updateParticipantByID(
      id,
      updateParticipantDto,
    );
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Record deleted by ID.' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnprocessableEntityResponse({
    description: 'Database error. (Unprocessable entity)',
  })
  deleteParticipantByID(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteResult> {
    return this.participantService.deleteParticipantByID(id);
  }
}
