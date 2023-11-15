import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { GameEntity } from "src/games/entities/game.entity";
import { Repository } from "typeorm";
import { createGameParams, updateGameParams } from "./utils/types";
import { UsersService } from "src/users/users.service";
import { sendGameDto } from "src/games/dtos/sendGame.dto";

@Injectable()
export class GamesService {
	constructor(
		@InjectRepository(GameEntity)
		private gameRepository: Repository<GameEntity>,
		@Inject(forwardRef(() => UsersService))
		private userService: UsersService
	) {}

	private async formatGameForSending(game: GameEntity): Promise<sendGameDto> {
		const sendGame: sendGameDto = {
			id: game.id,
			winnerID: game.winner.id,
			winnerUsername: game.winner.username,
			loserID: game.loser.id,
			loserUsername: game.loser.username,
			winnerScore: game.winnerScore,
			loserScore: game.loserScore,
			createdAt: game.createdAt,
		};
		return sendGame;
	}

	private async formatGamesArrayForSending(
		game: GameEntity[]
	): Promise<sendGameDto[]> {
		return await Promise.all(
			game.map(async (e: GameEntity) => {
				return await this.formatGameForSending(e);
			})
		);
	}

	fetchGames() {
		return this.gameRepository.find();
	}

	async saveGame(gameDetails: createGameParams) {
		const winner = await this.userService.fetchUserByID(gameDetails.winnerID);
		const loser = await this.userService.fetchUserByID(gameDetails.loserID);

		console.log("[Game Service]: Saving Game", gameDetails);
		const newGame = this.gameRepository.create({
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

	async fetchGamesByUserID(userID: number): Promise<sendGameDto[]> {
		const target = await this.userService.fetchUserByID(userID);
		const games = await this.gameRepository.find({
			where: [{ winner: target }, { loser: target }],
			relations: ["winner", "loser"],
		});
		return this.formatGamesArrayForSending(games);
	}

	updateGameByID(id: number, gameDetails: updateGameParams) {
		return this.gameRepository.update({ id }, { ...gameDetails });
	}

	deleteGameByID(id: number) {
		return this.gameRepository.delete({ id });
	}
}
