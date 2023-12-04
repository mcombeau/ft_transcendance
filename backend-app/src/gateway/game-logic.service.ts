import { Inject, forwardRef, Logger, Injectable } from "@nestjs/common";
import {
	Direction,
	GameGatewayService,
	GameRoom,
} from "./game.gateway.service";

export const WINNING_SCORE = 4;
export const GAME_SPEED = 6;

const TERRAIN_HEIGHT = 400;
const TERRAIN_WIDTH = 700;

const SKATE_HEIGHT: number = 80;
const SKATE_WIDTH: number = 10;

const MOVE_STEP: number = 7;
const BALL_RADIUS: number = 10;
const SKATE_X_1: number = 42;
const SKATE_X_2: number = 660;

const SKATE_MAX_Y: number = TERRAIN_HEIGHT;
const SKATE_MIN_Y = 0;

const BOTTOM_BOUNDARY = 410;
const TOP_BOUNDARY = 10;
const LEFT_BOUNDARY = 5;
const RIGHT_BOUNDARY = 710;

type Vector = {
	x: number;
	y: number;
};

export type State = {
	score: number[];
	skateTop1: number;
	skateTop2: number;
	live: boolean;
	isPaused: boolean;
	ballPos: Vector;
	ballDir: Vector;
};

@Injectable()
export class GameLogicService {
	constructor(
		@Inject(forwardRef(() => GameGatewayService))
		private gameGatewayService: GameGatewayService
	) {}

	readonly logger: Logger = new Logger("Game Logic Service");

	createGameState() {
		return {
			score: [0, 0],
			skateTop1: 160,
			skateTop2: 160,
			live: true,
			isPaused: false,
			ballPos: this.placeBall(),
			ballDir: {
				x: -1,
				y: 1,
			},
		};
	}

	private placeBall() {
		return { x: TERRAIN_WIDTH / 2, y: TERRAIN_HEIGHT / 2 };
	}

	randomInitialMove(gameState: State) {
		// pseudo-random ball behavior
		const moves = [
			{ x: 1, y: 1 },
			{ x: 1, y: 2 },
			{ x: 2, y: 1 },
			{ x: -1, y: -1 },
			{ x: -1, y: 1 },
		];
		const initialMove = moves[Math.floor(Math.random() * moves.length)];
		gameState.ballDir = initialMove;
	}

	private checkGoals(gameState: State) {
		//checking if the ball touches the left and right borders of the terrain
		if (
			gameState.ballPos.x - BALL_RADIUS + gameState.ballDir.x <=
			LEFT_BOUNDARY
		) {
			gameState.score = [gameState.score[0], gameState.score[1] + 1];
			this.resetBall(gameState);
			this.randomInitialMove(gameState);
		}

		if (
			gameState.ballPos.x + BALL_RADIUS + gameState.ballDir.x >=
			RIGHT_BOUNDARY
		) {
			gameState.score = [gameState.score[0] + 1, gameState.score[1]];
			this.resetBall(gameState);
			this.randomInitialMove(gameState);
		}
	}

	private checkPlayers(gameState: State) {
		//checking if the ball is touching the players, and if so, calculating the angle of rebound
		if (
			gameState.ballPos.x - BALL_RADIUS <= SKATE_X_1 &&
			gameState.ballPos.y + BALL_RADIUS >= gameState.skateTop1 &&
			gameState.ballPos.y - BALL_RADIUS <= gameState.skateTop1 + SKATE_HEIGHT
		) {
			gameState.ballDir = {
				x: -gameState.ballDir.x,
				y: gameState.ballDir.y,
			};
		}

		if (
			gameState.ballPos.x - BALL_RADIUS >= SKATE_X_2 &&
			gameState.ballPos.y + BALL_RADIUS >= gameState.skateTop2 &&
			gameState.ballPos.y - BALL_RADIUS <= gameState.skateTop2 + SKATE_HEIGHT
		) {
			gameState.ballDir = {
				x: -gameState.ballDir.x,
				y: gameState.ballDir.y,
			};
		}
	}

	private checkBallBoundaries(gameState: State) {
		//checking if the ball is touching the boundaries, and if so, calculating the angle of rebound
		if (
			gameState.ballPos.y + BALL_RADIUS + gameState.ballDir.y >=
				BOTTOM_BOUNDARY ||
			gameState.ballPos.y - BALL_RADIUS + gameState.ballDir.y <= TOP_BOUNDARY
		) {
			gameState.ballDir = {
				x: gameState.ballDir.x,
				y: -gameState.ballDir.y,
			};
		}

		if (
			gameState.ballPos.x - BALL_RADIUS + gameState.ballDir.x <=
				LEFT_BOUNDARY ||
			gameState.ballPos.x + BALL_RADIUS + gameState.ballDir.x >= RIGHT_BOUNDARY
		) {
			gameState.ballDir = {
				x: -gameState.ballDir.x,
				y: gameState.ballDir.y,
			};
		}
	}

	private check(gameRoom: GameRoom) {
		this.checkPlayers(gameRoom.gameState);
		this.checkGoals(gameRoom.gameState);
		this.checkBallBoundaries(gameRoom.gameState);
		this.checkGameOver(gameRoom);
	}

	tick(gameRoom: GameRoom) {
		if (gameRoom.gameState.live === true) {
			gameRoom.gameState.ballPos = {
				x: gameRoom.gameState.ballPos.x + gameRoom.gameState.ballDir.x,
				y: gameRoom.gameState.ballPos.y + gameRoom.gameState.ballDir.y,
			};
		}
		this.check(gameRoom);
	}

	private checkPlayerBoundaries(
		player: number, //checking the boundaries of players for going beyond the field
		gameState: State
	) {
		if (player === 1) {
			if (gameState.skateTop1 + SKATE_HEIGHT >= SKATE_MAX_Y) return 1;
			if (gameState.skateTop1 <= SKATE_MIN_Y) {
				return 2;
			}
		} else if (player === 2) {
			if (gameState.skateTop2 + SKATE_HEIGHT >= SKATE_MAX_Y) return 3;
			if (gameState.skateTop2 <= SKATE_MIN_Y) return 4;
		}

		return 0;
	}

	private resetPlayer(
		code: number, //return of players to the field, in case of exit
		gameState: State
	) {
		if (code === 1) {
			gameState.skateTop1 = SKATE_MAX_Y - SKATE_HEIGHT;
		}
		if (code === 2) {
			gameState.skateTop1 = SKATE_MIN_Y;
		}
		if (code === 3) {
			gameState.skateTop2 = SKATE_MAX_Y - SKATE_HEIGHT;
		}
		if (code === 4) {
			gameState.skateTop2 = SKATE_MIN_Y;
		}
	}

	private resetBall(gameState: State) {
		gameState.ballPos = this.placeBall();
	}

	// private restart(gameState: State) {
	// 	this.resetBall(gameState);
	// 	this.randomInitialMove(gameState);
	// }

	private pause(gameState: State) {
		gameState.live = !gameState.live;
		gameState.isPaused = !gameState.isPaused;
	}

	private async checkGameOver(gameRoom: GameRoom) {
		if (
			(gameRoom.gameState.score[0] === WINNING_SCORE ||
				gameRoom.gameState.score[1] === WINNING_SCORE) &&
			!gameRoom.gameState.isPaused
		) {
			this.pause(gameRoom.gameState);
			this.logger.log("[Check Game Over]: A player won!");

			await this.gameGatewayService.stopGame(gameRoom, true);
		}
	}

	movePlayer(playerIndex: number, direction: Direction, gameRoom: GameRoom) {
		const dir: number = direction === Direction.Up ? -1 : 1;

		if (playerIndex === 1) {
			gameRoom.gameState.skateTop1 += MOVE_STEP * dir;
		} else {
			gameRoom.gameState.skateTop2 += MOVE_STEP * dir;
		}

		if (this.checkPlayerBoundaries(playerIndex, gameRoom.gameState)) {
			this.resetPlayer(
				this.checkPlayerBoundaries(playerIndex, gameRoom.gameState),
				gameRoom.gameState
			);
		}
	}
}
