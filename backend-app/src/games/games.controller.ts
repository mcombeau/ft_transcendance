import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { GamesService } from './games.service';
import { createGameDto } from './dtos/createGame.dto';
import { updateGameDto } from './dtos/updateGame.dto';
import { GameNotFoundError } from 'src/exceptions/not-found.interceptor';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { GameEntity } from './entities/game.entity';
import { UsersService } from 'src/users/users.service';

@Controller('games')
@ApiTags('games')
export class GamesController {
    constructor(private gameService: GamesService, private userService: UsersService) {}

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

    @Get('all/:username')
    @ApiOkResponse({ type: GameEntity, description: 'Get all user games by username.' })
    @ApiBadRequestResponse({ description: 'Bad request.' })
    async getUserGamesByID(@Param('username') username: string) {
        const user = await this.userService.fetchUserByUsername(username);
        const games = await this.gameService.fetchUserAllGamesByID(user.id);
        if (!games)
            throw new GameNotFoundError(username);
        return games;
    }

    @Get('won/:username')
    @ApiOkResponse({ type: GameEntity, description: 'Get all user games by username.' })
    @ApiBadRequestResponse({ description: 'Bad request.' })
    async getUserWonGamesByID(@Param('username') username: string) {
        const user = await this.userService.fetchUserByUsername(username);
        const games = await this.gameService.fetchUserWonGamesByID(user.id);
        if (!games)
            throw new GameNotFoundError(username);
        return games;
    }

    @Get('lost/:username')
    @ApiOkResponse({ type: GameEntity, description: 'Get all user games by username.' })
    @ApiBadRequestResponse({ description: 'Bad request.' })
    async getUserLostGamesByID(@Param('username') username: string) {
        const user = await this.userService.fetchUserByUsername(username);
        const games = await this.gameService.fetchUserLostGamesByID(user.id);
        if (!games)
            throw new GameNotFoundError(username);
        return games;
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
