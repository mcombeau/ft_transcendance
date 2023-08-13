import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { InvitesService } from './invites.service';
import { InviteEntity } from './entities/Invite.entity';
import { createInviteDto } from './dtos/createInvite.dto';

@Controller('invites')
@ApiTags('invites')
export class InvitesController {
    constructor(private inviteService: InvitesService) {}

    @Get(':id')
    @ApiOkResponse({ type: InviteEntity, description: 'Get invite by ID.' })
    @ApiBadRequestResponse({ description: 'Bad request.' })
    getInviteByID(@Param('id', ParseIntPipe) id: number) {
        return this.inviteService.fetchInviteByID(id);
    }

    @Get('/sender/:username')
    @ApiOkResponse({ type: InviteEntity, description: 'Get invite by sender username.' })
    @ApiBadRequestResponse({ description: 'Bad request.' })
    getInvitesBySenderUsername(@Param('username') username: string) {
        return this.inviteService.fetchInvitesBySenderUsername(username);
    }

    @Get('/received/:username')
    @ApiOkResponse({ type: InviteEntity, description: 'Get invite by invited user username.' })
    @ApiBadRequestResponse({ description: 'Bad request.' })
    getInvitesByInvitedUsername(@Param('username') username: string) {
        return this.inviteService.fetchInvitesByInvitedUsername(username);
    }

    @Get()
    @ApiOkResponse({ type: InviteEntity, description: 'Get all invites.'})
    getAllInvites() {
        return this.inviteService.fetchAllInvites();
    }

    @Post()
    @ApiCreatedResponse({ type: InviteEntity, description: 'Record created.' })
    @ApiBadRequestResponse({ description: 'Bad request.' })
    @ApiUnprocessableEntityResponse({ description: 'Database error. (Unprocessable entity)' })
    createInvite(@Body() inviteDto: createInviteDto) {
        return this.inviteService.createInvite(inviteDto);
    }

    @Delete(':id')
    @ApiOkResponse({ description: 'Record deleted by ID.' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiUnprocessableEntityResponse({ description: 'Database error. (Unprocessable entity)' })
    deleteInviteByID(@Param('id', ParseIntPipe) id: number) {
        return this.inviteService.deleteInviteByID(id);
    }
}
