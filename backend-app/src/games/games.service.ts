import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameEntity } from 'src/games/entities/game.entity';
import { Repository } from 'typeorm';
import { createGameParams, updateGameParams } from './utils/types';
import { UsersService } from 'src/users/users.service';
import { GameCreationError } from 'src/exceptions/bad-request.interceptor';

@Injectable()
export class GamesService {
    constructor(
        @InjectRepository(GameEntity)
            private gameRepository: Repository<GameEntity>,
        @Inject(forwardRef(() => UsersService))
            private userService: UsersService,
    ) {}

    fetchGames() {
        return this.gameRepository.find({relations: ['winner', 'loser']});
    }

    fetchGameByID(id: number) {
        return this.gameRepository.findOne({ where: { id }});
    }

    async fetchUserAllGamesByID(userID: number) {
        var wonGames = await this.fetchUserWonGamesByID(userID);
        var lostGames = await this.fetchUserLostGamesByID(userID);

        const allGames = wonGames.concat(lostGames);
        return allGames;
    }

    async fetchUserWonGamesByID(userID: number) {
        const wonGames = await this.gameRepository.find({
            where: {
              winner: { id: userID }
            },
            relations: ['winner', 'loser'],
          });
        return wonGames;
    }

    async fetchUserLostGamesByID(userID: number) {
        const lostGames = await this.gameRepository.find({
            where: {
              loser: { id: userID }
            },
            relations: ['winner', 'loser'],
          });
        return lostGames;
    }

    async createGame(gameDetails: createGameParams) {
        const winner = await this.userService.fetchUserByUsername(gameDetails.winnerName);
        const loser = await this.userService.fetchUserByUsername(gameDetails.loserName);

        if (!winner || !loser) {
            throw new GameCreationError(`[Game Service]: User does not exist.`);
        }

        const newGame = this.gameRepository.create({
            winner: { id: winner.id },
            loser: { id: loser.id },
            winnerScore: gameDetails.winnerScore,
            loserScore: gameDetails.loserScore,
            createdAt: new Date(),
        });
        return this.gameRepository.save(newGame);
    }

    updateGameByID(id: number, gameDetails: updateGameParams) {
        return this.gameRepository.update( { id },  { ...gameDetails });
    }

    deleteGameByID(id: number) {
        return this.gameRepository.delete({ id });
    }
}
