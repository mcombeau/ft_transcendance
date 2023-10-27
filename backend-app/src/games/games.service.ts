import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameEntity } from 'src/games/entities/game.entity';
import { Repository } from 'typeorm';
import { createGameParams, updateGameParams } from './utils/types';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GameEntity)
    private gameRepository: Repository<GameEntity>,
    @Inject(forwardRef(() => UsersService))
    private userService: UsersService,
  ) {}

  fetchGames() {
    return this.gameRepository.find();
  }

  async createGame(gameDetails: createGameParams) {
    const winner = await this.userService.fetchUserByID(gameDetails.winnerID);
    const loser = await this.userService.fetchUserByID(gameDetails.loserID);

    const newGame = await this.gameRepository.create({
      winner: winner,
      loser: loser,
      winnerScore: gameDetails.winnerScore,
      loserScore: gameDetails.loserScore,
      createdAt: new Date(),
    });
    return this.gameRepository.save(newGame);
  }

  fetchGameByID(id: number) {
    return this.gameRepository.findOne({ where: { id } });
  }

  updateGameByID(id: number, gameDetails: updateGameParams) {
    return this.gameRepository.update({ id }, { ...gameDetails });
  }

  deleteGameByID(id: number) {
    return this.gameRepository.delete({ id });
  }
}
