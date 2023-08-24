import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameEntity } from 'src/games/entities/game.entity';
import { Repository } from 'typeorm';
import { createGameParams, updateGameParams } from './utils/types';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GameEntity)
    private gameRepository: Repository<GameEntity>,
  ) {}

  fetchGames() {
    return this.gameRepository.find();
  }

  async createGame(gameDetails: createGameParams) {
    const newGame = this.gameRepository.create({
      ...gameDetails,
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
