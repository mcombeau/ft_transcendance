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

	private checkSkate1Collision(gameState: State) {
		const ball = gameState.ballPos;
		const skate = gameState.skate1;

		// Collision left of skate 1
		if (
			ball.x - BALL_RADIUS <= skate.x + SKATE_WIDTH &&
			!(ball.y + BALL_RADIUS <= skate.y) &&
			!(ball.y - BALL_RADIUS >= skate.y + SKATE_HEIGHT)
		) {
			this.logger.debug("Ball collision side of skate");
			this.reboundBall(gameState, { x: -1, y: 1 });
		}

		//Collision top of skate 1
		if (
			ball.y + BALL_RADIUS >= skate.y &&
			ball.y - BALL_RADIUS <= skate.y &&
			ball.x - BALL_RADIUS <= skate.x + SKATE_WIDTH
		) {
			this.logger.debug("Ball collision TOP of skate");
			this.reboundBall(gameState, { x: 1, y: -1 });
		}

		////Collision bottom of skate 1
		if (
			ball.y - BALL_RADIUS <= skate.y + SKATE_HEIGHT &&
			ball.y + BALL_RADIUS >= skate.y + SKATE_HEIGHT &&
			ball.x - BALL_RADIUS <= skate.x + SKATE_WIDTH
		) {
			this.logger.debug("Ball collision BOTTOM of skate");
			this.reboundBall(gameState, { x: 1, y: -1 });
		}
	}

	private checkSkate2Collision(gameState: State) {
		const ball = gameState.ballPos;
		const skate = gameState.skate2;

		// Collision right of skate 2
		if (
			ball.x + BALL_RADIUS >= skate.x &&
			!(ball.y + BALL_RADIUS <= skate.y) &&
			!(ball.y - BALL_RADIUS >= skate.y + SKATE_HEIGHT)
		) {
			this.logger.debug("Ball collision side of skate");
			this.reboundBall(gameState, { x: -1, y: 1 });
		}

		//Collision top of skate 2
		if (
			ball.y + BALL_RADIUS >= skate.y &&
			ball.y - BALL_RADIUS <= skate.y &&
			ball.x + BALL_RADIUS >= skate.x
		) {
			this.logger.debug("Ball collision TOP of skate");
			this.reboundBall(gameState, { x: 1, y: -1 });
		}

		////Collision bottom of skate 2
		if (
			ball.y - BALL_RADIUS <= skate.y + SKATE_HEIGHT &&
			ball.y + BALL_RADIUS >= skate.y + SKATE_HEIGHT &&
			ball.x + BALL_RADIUS >= skate.x
		) {
			this.logger.debug("Ball collision BOTTOM of skate");
			this.reboundBall(gameState, { x: 1, y: -1 });
		}
	}

	private checkBallSkateCollision(gameState: State) {
		this.checkSkate1Collision(gameState);
		this.checkSkate2Collision(gameState);
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
