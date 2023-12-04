import { Inject, forwardRef, Logger, Injectable } from "@nestjs/common";
import {
	Direction,
	GameGatewayService,
	GameRoom,
} from "./game.gateway.service";

export const WINNING_SCORE = 40;
export const GAME_SPEED = 12;

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
	// skateTop1: number;
	// skateTop2: number;
	skate1: Vector;
	skate2: Vector;
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
			// skateTop1: 160,
			// skateTop2: 160,
			skate1: { x: SKATE_X_1, y: 160 },
			skate2: { x: SKATE_X_2, y: 160 },
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

	private checkBallGoalCollision(gameState: State) {
		//checking if the ball touches the left and right borders of the terrain
		if (
			gameState.ballPos.x - BALL_RADIUS + gameState.ballDir.x <=
			LEFT_BOUNDARY
		) {
			this.logger.debug("Ball collided with goal left");
			gameState.score = [gameState.score[0], gameState.score[1] + 1];
			this.resetBall(gameState);
			this.randomInitialMove(gameState);
		}

		if (
			gameState.ballPos.x + BALL_RADIUS + gameState.ballDir.x >=
			RIGHT_BOUNDARY
		) {
			this.logger.debug("Ball collided with goal right");
			gameState.score = [gameState.score[0] + 1, gameState.score[1]];
			this.resetBall(gameState);
			this.randomInitialMove(gameState);
		}
	}

	private reboundBall(gameState: State, direction: Vector) {
		gameState.ballDir = {
			x: gameState.ballDir.x * direction.x,
			y: gameState.ballDir.y * direction.y,
		};
	}

	//private checkBallSkateCollision(gameState: State) {
	//	//if side of ball touches side of skate
	//}

	private checkBallSkateCollision(gameState: State) {
		//checking if the ball is touching the players, and if so, calculating the angle of rebound
		if (
			// If surface of ball is behind the apparent surface of left skate
			gameState.ballPos.x - BALL_RADIUS <= SKATE_X_1 &&
			// If surface of ball is in front of the backside surface of left skate
			gameState.ballPos.x + BALL_RADIUS >= SKATE_X_1 - SKATE_WIDTH &&
			// if bottom of the ball is below the top of the left skate
			gameState.ballPos.y + BALL_RADIUS >= gameState.skate1.y &&
			// if top of the ball is above the bottom of the left skate
			gameState.ballPos.y - BALL_RADIUS <= gameState.skate1.y + SKATE_HEIGHT
		) {
			if (
				gameState.ballPos.x < SKATE_X_1 &&
				gameState.ballPos.x > SKATE_X_1 - SKATE_WIDTH
			) {
				this.logger.debug("Ball collided with skate 1 on SMALL side");
				this.reboundBall(gameState, { x: 1, y: -1 });
			} else {
				this.logger.debug("Ball collided with skate 1 on LONG side");
				this.reboundBall(gameState, { x: -1, y: 1 });
			}
		}
		// if (
		// 	gameState.ballPos.x - BALL_RADIUS >= SKATE_X_1 - SKATE_WIDTH &&
		// 	gameState.ballPos.y + BALL_RADIUS >= gameState.skateTop1 &&
		// 	gameState.ballPos.y - BALL_RADIUS <= gameState.skateTop1 + SKATE_HEIGHT
		// ) {
		// 	this.logger.debug("--- Ball collided with BEHIND skate 1");
		// 	this.reboundBall(gameState, { x: -1, y: 1 });
		// }

		if (
			gameState.ballPos.x - BALL_RADIUS >= SKATE_X_2 &&
			gameState.ballPos.x + BALL_RADIUS <= SKATE_X_2 + SKATE_WIDTH &&
			gameState.ballPos.y + BALL_RADIUS >= gameState.skate2.y &&
			gameState.ballPos.y - BALL_RADIUS <= gameState.skate2.y + SKATE_HEIGHT
		) {
			if (
				gameState.ballPos.x > SKATE_X_2 &&
				gameState.ballPos.x < SKATE_X_2 + SKATE_WIDTH
			) {
				this.logger.debug("Ball collided with skate 2 on SMALL side");
				this.reboundBall(gameState, { x: 1, y: -1 });
			} else {
				this.logger.debug("Ball collided with skate 2 on LONG side");
				this.reboundBall(gameState, { x: -1, y: 1 });
			}
			// this.logger.debug("Ball collided with skate 2");
			// this.reboundBall(gameState, { x: -1, y: 1 });
		}
		// if (
		// 	gameState.ballPos.x - BALL_RADIUS <= SKATE_X_2 + SKATE_WIDTH &&
		// 	gameState.ballPos.y + BALL_RADIUS >= gameState.skateTop2 &&
		// 	gameState.ballPos.y - BALL_RADIUS <= gameState.skateTop2 + SKATE_HEIGHT
		// ) {
		// 	this.logger.debug("--- Ball collided with BEHIND skate 2");
		// 	this.reboundBall(gameState, { x: -1, y: 1 });
		// }
	}

	private checkBallTerrainCollision(gameState: State) {
		//checking if the ball is touching the boundaries, and if so, calculating the angle of rebound
		if (
			gameState.ballPos.y + BALL_RADIUS + gameState.ballDir.y >=
				BOTTOM_BOUNDARY ||
			gameState.ballPos.y - BALL_RADIUS + gameState.ballDir.y <= TOP_BOUNDARY
		) {
			this.reboundBall(gameState, { x: 1, y: -1 });
		}
	}

	private check(gameRoom: GameRoom) {
		this.checkBallGoalCollision(gameRoom.gameState);
		this.checkBallSkateCollision(gameRoom.gameState);
		this.checkBallTerrainCollision(gameRoom.gameState);
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

	private checkSkateBoundaries(
		player: number, //checking the boundaries of players for going beyond the field
		gameState: State
	) {
		if (player === 1) {
			if (gameState.skate1.y + SKATE_HEIGHT >= SKATE_MAX_Y) return 1;
			if (gameState.skate1.y <= SKATE_MIN_Y) {
				return 2;
			}
		} else if (player === 2) {
			if (gameState.skate2.y + SKATE_HEIGHT >= SKATE_MAX_Y) return 3;
			if (gameState.skate2.y <= SKATE_MIN_Y) return 4;
		}

		return 0;
	}

	private resetPlayer(
		code: number, //return of players to the field, in case of exit
		gameState: State
	) {
		if (code === 1) {
			gameState.skate1.y = SKATE_MAX_Y - SKATE_HEIGHT;
		}
		if (code === 2) {
			gameState.skate1.y = SKATE_MIN_Y;
		}
		if (code === 3) {
			gameState.skate2.y = SKATE_MAX_Y - SKATE_HEIGHT;
		}
		if (code === 4) {
			gameState.skate2.y = SKATE_MIN_Y;
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
			gameRoom.gameState.skate1.y += MOVE_STEP * dir;
		} else {
			gameRoom.gameState.skate2.y += MOVE_STEP * dir;
		}

		if (this.checkSkateBoundaries(playerIndex, gameRoom.gameState)) {
			this.resetPlayer(
				this.checkSkateBoundaries(playerIndex, gameRoom.gameState),
				gameRoom.gameState
			);
		}
	}
}
