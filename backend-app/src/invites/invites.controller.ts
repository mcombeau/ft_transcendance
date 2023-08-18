import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { InvitesService } from './invites.service';
import { InviteEntity } from './entities/Invite.entity';
import { createInviteDto } from './dtos/createInvite.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
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
