import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { InvitesService } from './invites.service';

@Controller('invites')
@ApiTags('invites')
export class InvitesController {
    constructor(private inviteService: InvitesService) {}

    // @Get(':id')
    // @ApiOkResponse({ type: ChatParticipantEntity, description: 'Get chat participant by ID.' })
    // @ApiBadRequestResponse({ description: 'Bad request.' })
    // getParticipantByID(@Param('id', ParseIntPipe) id: number) {
    //     return this.participantService.fetchParticipantByID(id);
    // }

    // @Get()
    // @ApiOkResponse({ type: ChatParticipantEntity, isArray: true, description: 'Get all chat participants.'})
    // getAllParticipants() {
    //     return this.participantService.fetchParticipants();
    // }

    // @Post()
    // @ApiCreatedResponse({ type: ChatParticipantEntity, description: 'Record created.' })
    // @ApiBadRequestResponse({ description: 'Bad request.' })
    // @ApiUnprocessableEntityResponse({ description: 'Database error. (Unprocessable entity)' })
    // createParticipant(@Body() participantDto: createParticipantDto) {
    //     return this.participantService.createChatParticipant(participantDto.userID, participantDto.chatRoomID, 0);
    // }

    // @Patch(':id')
    // @ApiCreatedResponse({ type: ChatParticipantEntity, description: 'Record updated.' })
    // @ApiBadRequestResponse({ description: 'Bad request' })
    // @ApiUnprocessableEntityResponse({ description: 'Database error. (Unprocessable entity)' })
    // async updateParticipantByID(
    //     @Param('id', ParseIntPipe) id: number,
    //     @Body() updateParticipantDto: updateParticipantDto,
    // ) {
    //     await this.participantService.updateParticipantByID(id, updateParticipantDto);
    // }

    // @Delete(':id')
    // @ApiOkResponse({ description: 'Record deleted by ID.' })
    // @ApiBadRequestResponse({ description: 'Bad request' })
    // @ApiUnprocessableEntityResponse({ description: 'Database error. (Unprocessable entity)' })
    // deleteParticipantByID(@Param('id', ParseIntPipe) id: number) {
    //     return this.participantService.deleteParticipantByID(id);
    // }
}
