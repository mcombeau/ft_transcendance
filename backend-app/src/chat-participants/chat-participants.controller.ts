import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ChatParticipantsService } from './chat-participants.service';
import { createParticipantDto } from './dtos/createChats.dto';

@Controller('chat-participants')
export class ChatParticipantsController {
    constructor(private participantService: ChatParticipantsService) {}

    @Get()
    getAllParticipants() {
        return this.participantService.fetchParticipants();
    }

    @Get(':id')
    getParticipantByID(@Param('id', ParseIntPipe) id: number) {
        return this.participantService.fetchParticipantByID(id);
    }

    @Post()
    createParticipant(@Body() participantDto: createParticipantDto) {
        return this.participantService.createChatParticipant(participantDto.userID, participantDto.chatRoomID);
    }

    @Delete(':id')
    deleteParticipantByID(@Param('id', ParseIntPipe) id: number) {
        return this.participantService.deleteParticipantByID(id);
    }

}
