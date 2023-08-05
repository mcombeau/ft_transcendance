import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { GamesService } from './games.service';
import { createGameDto } from './dtos/createGame.dto';
import { updateGameDto } from './dtos/updateGame.dto';
import { GameNotFoundError } from 'src/exceptions/not-found.interceptor';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { GameEntity } from './entities/game.entity';

@Controller('games')
@ApiTags('games')
export class GamesController {
    constructor(private gameService: GamesService) {}

    @Get()
    @ApiOkResponse({ type: GameEntity, isArray: true, description: 'Get all game records.' })
    getGames() {
        return this.gameService.fetchGames();
    }

    @Post()
    @ApiCreatedResponse({ type: GameEntity, description: 'Create record.' })
    @ApiBadRequestResponse({ description: 'Bad request.' })
    @ApiUnprocessableEntityResponse({ description: 'Database error. (Unprocessable entity)' })
    @UsePipes(new ValidationPipe())
    createGame(@Body() gameDto: createGameDto) {
        return this.gameService.createGame(gameDto);
    }

    @Get(':id')
    @ApiOkResponse({ type: GameEntity, description: 'Get game by ID.' })
    @ApiBadRequestResponse({ description: 'Bad request.' })
    async getGameByID(@Param('id', ParseIntPipe) id: number) {
        const game = await this.gameService.fetchGameByID(id);
        if (!game)
            throw new GameNotFoundError(id.toString());
        return game;
    }

    @Get('all/user/:id')
    @ApiOkResponse({ type: GameEntity, description: 'Get all user games by user ID.' })
    @ApiBadRequestResponse({ description: 'Bad request.' })
    async getUserGamesByID(@Param('id', ParseIntPipe) id: number) {
        const game = await this.gameService.fetchUserAllGamesByID(id);
        if (!game)
            throw new GameNotFoundError(id.toString());
        return game;
    }

    @Get('won/user/:id')
    @ApiOkResponse({ type: GameEntity, description: 'Get all user games by user ID.' })
    @ApiBadRequestResponse({ description: 'Bad request.' })
    async getUserWonGamesByID(@Param('id', ParseIntPipe) id: number) {
        const game = await this.gameService.fetchUserWonGamesByID(id);
        if (!game)
            throw new GameNotFoundError(id.toString());
        return game;
    }

    @Get('lost/user/:id')
    @ApiOkResponse({ type: GameEntity, description: 'Get all user games by user ID.' })
    @ApiBadRequestResponse({ description: 'Bad request.' })
    async getUserLostGamesByID(@Param('id', ParseIntPipe) id: number) {
        const game = await this.gameService.fetchUserLostGamesByID(id);
        if (!game)
            throw new GameNotFoundError(id.toString());
        return game;
    }

    @Patch(':id')
    @ApiCreatedResponse({ type: GameEntity, description: 'Record updated.' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiUnprocessableEntityResponse({ description: 'Database error. (Unprocessable entity)' })
    async updateGameByID(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateGameDto: updateGameDto
    ) {
        await this.gameService.updateGameByID(id, updateGameDto);
    }

    @Delete(':id')
    @ApiOkResponse({ description: 'Record deleted by ID.' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiUnprocessableEntityResponse({ description: 'Database error. (Unprocessable entity)' })
    async deleteGameByID(@Param('id', ParseIntPipe) id: number) {
        await this.gameService.deleteGameByID(id);
    }
}
