import { Inject, forwardRef, Logger, Injectable } from "@nestjs/common";
import {
	Direction,
	GameGatewayService,
	GameRoom,
} from "./game.gateway.service";

export const WINNING_SCORE = 10;
export const GAME_SPEED = 6;

const TERRAIN_HEIGHT = 400;
const TERRAIN_WIDTH = 700;

const SKATE_HEIGHT: number = 80;
const SKATE_WIDTH: number = 10;

const MOVE_STEP: number = 7;
const BALL_RADIUS: number = 10;
const SKATE_X_1: number = 15;
const SKATE_X_2: number = 685;

const SKATE_MAX_Y: number = TERRAIN_HEIGHT;
const SKATE_MIN_Y = 0;

const SPEED_INCREASE: number = 1;

type Vector = {
	x: number;
	y: number;
};

export type State = {
	score: number[];
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

	private get_random_value(min: number, max: number): number {
		let value = 0;

		while (value > -0.2 && value < 0.2) {
			value = Math.random() * (max - min) + min;
		}

		return value;
	}

	private normalize_vector(vector: Vector): Vector {
		const norm = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
		return {
			x: vector.x / norm,
			y: vector.y / norm,
		};
	}

	// TODO: put back
	// randomInitialMove(gameState: State) {
	// 	let initialMove = {
	// 		x: this.get_random_value(-1, 1),
	// 		y: this.get_random_value(-1, 1),
	// 	};

	// 	initialMove = this.normalize_vector(initialMove);
	// 	gameState.ballDir = initialMove;
	// }

	randomInitialMove(gameState: State) {
		// pseudo-random ball behavior
		const moves = [
			{ x: 1, y: 1 },
			{ x: 1, y: -1 },
			{ x: -1, y: -1 },
			{ x: -1, y: 1 },
		];
		const initialMove = moves[Math.floor(Math.random() * moves.length)];
		gameState.ballDir = initialMove;
	}
	private checkBallGoalCollision(gameState: State) {
		//checking if the ball touches the left and right borders of the terrain
		if (
			gameState.ballPos.x + BALL_RADIUS + gameState.ballDir.x <=
			gameState.skate1.x + SKATE_WIDTH
		) {
			gameState.score = [gameState.score[0], gameState.score[1] + 1];
			this.resetBall(gameState);
			this.randomInitialMove(gameState);
			this.logger.debug("[LEFT GOAL]");
		}
		if (
			gameState.ballPos.x - BALL_RADIUS + gameState.ballDir.x >=
			gameState.skate2.x - SKATE_WIDTH
		) {
			gameState.score = [gameState.score[0] + 1, gameState.score[1]];
			this.resetBall(gameState);
			this.randomInitialMove(gameState);
			this.logger.debug("[RIGHT GOAL]");
		}
	}

	private capSpeedIncrease(direction: Vector) {
		const maxSpeed: number = 4;
		if (direction.x < -maxSpeed) {
			direction.x = -maxSpeed;
		} else if (direction.x > maxSpeed) {
			direction.x = maxSpeed;
		}
		if (direction.y < -maxSpeed) {
			direction.y = -maxSpeed;
		} else if (direction.y > maxSpeed) {
			direction.y = maxSpeed;
		}
		return direction;
	}

	private reboundBall(gameState: State, direction: Vector) {
		this.logger.debug("[REBOUND BALL]");
		let newDir: Vector = {
			x: gameState.ballDir.x * direction.x,
			y: gameState.ballDir.y * direction.y,
		};
		gameState.ballDir = newDir;
	}

	private checkSkate1Collision(gameState: State) {
		const ball = {
			top: gameState.ballPos.y - BALL_RADIUS,
			bottom: gameState.ballPos.y + BALL_RADIUS,
			left: gameState.ballPos.x - BALL_RADIUS,
			right: gameState.ballPos.x + BALL_RADIUS,
		};
		const skate = {
			top: gameState.skate1.y,
			bottom: gameState.skate1.y + SKATE_HEIGHT,
			left: gameState.skate1.x,
			right: gameState.skate1.x + SKATE_WIDTH,
		};

		// Collision left of skate 1
		if (
			ball.bottom >= skate.top &&
			ball.top <= skate.top &&
			ball.left <= skate.right
		) {
			//Collision top of skate 1
			// this.logger.debug("[1 TOP]");
			this.reboundBall(gameState, { x: 1, y: -SPEED_INCREASE });
		}
		if (
			ball.top <= skate.bottom &&
			ball.bottom >= skate.bottom &&
			ball.left <= skate.right
		) {
			////Collision bottom of skate 1
			// this.logger.debug("[1 BOTTOM]");
			this.reboundBall(gameState, { x: 1, y: -SPEED_INCREASE });
		}
		if (
			ball.left <= skate.right &&
			!(ball.bottom <= skate.top) &&
			!(ball.top >= skate.bottom)
		) {
			// this.logger.debug("[1 LEFT]");
			this.reboundBall(gameState, { x: -SPEED_INCREASE, y: 1 });
		}
	}

	private checkSkate2Collision(gameState: State) {
		const ball = {
			top: gameState.ballPos.y - BALL_RADIUS,
			bottom: gameState.ballPos.y + BALL_RADIUS,
			left: gameState.ballPos.x - BALL_RADIUS,
			right: gameState.ballPos.x + BALL_RADIUS,
		};
		const skate = {
			top: gameState.skate2.y,
			bottom: gameState.skate2.y + SKATE_HEIGHT,
			left: gameState.skate2.x - SKATE_WIDTH,
			right: gameState.skate2.x,
		};

		if (
			ball.right >= skate.left &&
			!(ball.bottom <= skate.top) &&
			!(ball.top >= skate.bottom)
		) {
			// Collision right of skate 2
			// this.logger.debug("[2 RIGHT]");
			this.reboundBall(gameState, { x: -SPEED_INCREASE, y: 1 });
		}
		if (
			ball.bottom >= skate.top &&
			ball.top <= skate.top &&
			ball.right >= skate.left
		) {
			//Collision top of skate 2
			// this.logger.debug("[2 TOP]");
			this.reboundBall(gameState, { x: 1, y: -SPEED_INCREASE });
		}
		if (
			ball.top <= skate.bottom &&
			ball.bottom >= skate.bottom &&
			ball.right >= skate.left
		) {
			////Collision bottom of skate 2
			// this.logger.debug("[2 BOTTOM]");
			this.reboundBall(gameState, { x: 1, y: -SPEED_INCREASE });
		}
	}

	private isBallInsideSkate(gameState: State) {
		const ball = {
			top: gameState.ballPos.y - BALL_RADIUS,
			bottom: gameState.ballPos.y + BALL_RADIUS,
			left: gameState.ballPos.x - BALL_RADIUS,
			right: gameState.ballPos.x + BALL_RADIUS,
		};
		const skate1 = {
			top: gameState.skate1.y,
			bottom: gameState.skate1.y + SKATE_HEIGHT,
			left: gameState.skate1.x,
			right: gameState.skate1.x + SKATE_WIDTH,
		};
		const skate2 = {
			top: gameState.skate2.y,
			bottom: gameState.skate2.y + SKATE_HEIGHT,
			left: gameState.skate2.x - SKATE_WIDTH,
			right: gameState.skate2.x,
		};
		// Skate 1
		if (
			ball.left < skate1.right &&
			((ball.bottom > skate1.top && ball.top < skate1.bottom) ||
				(ball.top < skate1.bottom && ball.bottom > skate1.top))
		) {
			this.logger.debug("[BALL INSIDE SKATE 1]");
		} else if (
			ball.right > skate2.left &&
			((ball.bottom > skate2.top && ball.top < skate2.bottom) ||
				(ball.top < skate2.bottom && ball.bottom > skate2.top))
		) {
			this.logger.debug("[BALL INSIDE SKATE 2]");
		}
	}

	private checkBallSkateCollision(gameState: State) {
		// this.isBallInsideSkate(gameState);
		this.checkSkate1Collision(gameState);
		this.checkSkate2Collision(gameState);
	}

	private checkBallTerrainCollision(gameState: State) {
		//checking if the ball is touching the boundaries, and if so, calculating the angle of rebound
		if (
			gameState.ballPos.y + BALL_RADIUS + gameState.ballDir.y >=
				TERRAIN_HEIGHT ||
			gameState.ballPos.y - BALL_RADIUS + gameState.ballDir.y <= 0
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

	private placeBall() {
		return { x: TERRAIN_WIDTH / 2, y: TERRAIN_HEIGHT / 2 };
	}

	private resetBall(gameState: State) {
		gameState.ballPos = this.placeBall();
	}

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
