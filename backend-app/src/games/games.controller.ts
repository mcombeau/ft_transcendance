import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, ParseIntPipe, Patch, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { GamesService } from './games.service';
import { createGameDto } from './dtos/createGame.dto';
import { updateUsersDto } from 'src/users/dtos/updateUsers.dto';
import { updateGameDto } from './dtos/updateGame.dto';

@Controller('games')
export class GamesController {
    constructor(private gameService: GamesService) {}

    @Get()
    getGames() {
        return this.gameService.fetchGames();
    }

    @Post()
    @UsePipes(new ValidationPipe())
    createGame(@Body() gameDto: createGameDto) {
        console.log('A game has been posted');
        console.log(gameDto);
        return this.gameService.createGame(gameDto);
    }

    @Get(':id')
    async getGameByID(@Param('id', ParseIntPipe) id: number) {
        const game = await this.gameService.fetchGameByID(id);
        if (!game)
            throw new HttpException('Game not found', HttpStatus.BAD_REQUEST);
        return game;
    }

    @Patch(':id')
    async updateGameByID(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateGameDto: updateGameDto
    ) {
        await this.gameService.updateGameByID(id, updateGameDto);
    }

    @Delete(':id')
    async deleteGameByID(@Param('id', ParseIntPipe) id: number) {
        await this.gameService.deleteGameByID(id);
    }
}
