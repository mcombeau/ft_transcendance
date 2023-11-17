import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Post,
} from "@nestjs/common";
import { GamesService } from "./games.service";
import { createGameDto } from "./dtos/createGame.dto";
import { GameNotFoundError } from "src/exceptions/not-found.interceptor";
import {
	ApiBadRequestResponse,
	ApiCreatedResponse,
	ApiOkResponse,
	ApiTags,
	ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { GameEntity } from "./entities/game.entity";
import { updateGameDto } from "./dtos/updateGame.dto";
import { sendGameDto } from "./dtos/sendGame.dto";

@ApiTags("games")
@Controller("games")
export class GamesController {
	constructor(private gameService: GamesService) {}

	@Get()
	@ApiOkResponse({
		type: sendGameDto,
		isArray: true,
		description: "Get all games.",
	})
	getGames(): Promise<sendGameDto[]> {
		return this.gameService.fetchGames();
	}

	@Post()
	@ApiCreatedResponse({
		type: GameEntity,
		description: "Record created.",
	})
	@ApiBadRequestResponse({ description: "Bad request." })
	@ApiUnprocessableEntityResponse({
		description: "Database error. (Unprocessable entity)",
	})
	createGame(@Body() gameDto: createGameDto) {
		return this.gameService.saveGame(gameDto);
	}

	@Get(":id")
	@ApiOkResponse({
		type: GameEntity,
		description: "Get game by ID.",
	})
	async getGameByID(@Param("id", ParseIntPipe) id: number) {
		const game = await this.gameService.fetchGameByID(id);
		if (!game) throw new GameNotFoundError(id.toString());
		return game;
	}

	@Patch(":id")
	@ApiCreatedResponse({
		type: GameEntity,
		description: "Record updated.",
	})
	@ApiBadRequestResponse({ description: "Bad request" })
	@ApiUnprocessableEntityResponse({
		description: "Database error. (Unprocessable entity)",
	})
	async updateGameByID(
		@Param("id", ParseIntPipe) id: number,
		@Body() updateGameDto: updateGameDto
	) {
		await this.gameService.updateGameByID(id, updateGameDto);
	}

	@Delete(":id")
	@ApiOkResponse({ description: "Record deleted by ID." })
	@ApiBadRequestResponse({ description: "Bad request" })
	@ApiUnprocessableEntityResponse({
		description: "Database error. (Unprocessable entity)",
	})
	async deleteGameByID(@Param("id", ParseIntPipe) id: number) {
		await this.gameService.deleteGameByID(id);
	}
}
