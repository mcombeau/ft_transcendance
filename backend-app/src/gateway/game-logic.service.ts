import { Inject, forwardRef, Logger, Injectable } from "@nestjs/common";
import {
	Direction,
	GameGatewayService,
	GameRoom,
} from "./game.gateway.service";

export const WINNING_SCORE = 4;
export const GAME_SPEED = 6;

const MOVE_STEP: number = 7;
const SKATE_HEIGHT: number = 80;
const GOAL_HEIGHT: number = 160;
const GOAL_POS_1: Position = { x: 3, y: 100 };
const GOAL_POS_2: Position = { x: 697, y: 100 };
const BALL_RADIUS: number = 10;
const SKATE_X_1: number = 42;
const SKATE_X_2: number = 660;
const SKATE_MAX_Y: number = 400;
const SKATE_MIN_Y = 0;
const BOTTOM_BOUNDARY = 410;
const TOP_BOUNDARY = 10;
const LEFT_BOUNDARY = 5;
const RIGHT_BOUNDARY = 710;

export type Position = {
	x: number;
	y: number;
};

export type Step = {
	stepX: number;
	stepY: number;
};

export type State = {
	result: number[];
	p1: number;
	p2: number;
	live: boolean;
	isPaused: boolean;
	ballPosition: Position;
	move: Step;
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
			result: [0, 0],
			p1: 160,
			p2: 160,
			live: true,
			isPaused: false,
			ballPosition: this.placeBall(),
			move: {
				stepX: -1,
				stepY: 1,
			},
		};
	}

	private placeBall() {
		return { x: 250, y: 250 };
	}

	randomInitialMove(gameState: State) {
		// pseudo-random ball behavior
		const moves = [
			{ stepX: 1, stepY: 1 },
			{ stepX: 1, stepY: 2 },
			{ stepX: 2, stepY: 1 },
			{ stepX: -1, stepY: -1 },
			{ stepX: -1, stepY: 1 },
		];
		const initialMove = moves[Math.floor(Math.random() * moves.length)];
		gameState.move = initialMove;
	}

	private checkGoals(gameState: State) {
		//checking if the ball touches the borders of the goal
		if (
			gameState.ballPosition.x - BALL_RADIUS <=
				GOAL_POS_1.x + BALL_RADIUS * 2 &&
			gameState.ballPosition.y + BALL_RADIUS >= GOAL_POS_1.y &&
			gameState.ballPosition.y - BALL_RADIUS <= GOAL_POS_1.y + GOAL_HEIGHT
		) {
			gameState.result = [gameState.result[0], gameState.result[1] + 1];
			this.resetBall(gameState);
			this.randomInitialMove(gameState);
		}

		if (
			gameState.ballPosition.x + BALL_RADIUS >= GOAL_POS_2.x &&
			gameState.ballPosition.y + BALL_RADIUS >= GOAL_POS_2.y &&
			gameState.ballPosition.y - BALL_RADIUS <= GOAL_POS_2.y + GOAL_HEIGHT
		) {
			gameState.result = [gameState.result[0] + 1, gameState.result[1]];
			this.resetBall(gameState);
			this.randomInitialMove(gameState);
		}
	}

	private checkPlayers(gameState: State) {
		//checking if the ball is touching the players, and if so, calculating the angle of rebound
		if (
			gameState.ballPosition.x - BALL_RADIUS <= SKATE_X_1 &&
			gameState.ballPosition.y + BALL_RADIUS >= gameState.p1 &&
			gameState.ballPosition.y - BALL_RADIUS <= gameState.p1 + SKATE_HEIGHT
		) {
			gameState.move = {
				stepX: -gameState.move.stepX,
				stepY: gameState.move.stepY,
			};
		}

		if (
			gameState.ballPosition.x - BALL_RADIUS >= SKATE_X_2 &&
			gameState.ballPosition.y + BALL_RADIUS >= gameState.p2 &&
			gameState.ballPosition.y - BALL_RADIUS <= gameState.p2 + SKATE_HEIGHT
		) {
			gameState.move = {
				stepX: -gameState.move.stepX,
				stepY: gameState.move.stepY,
			};
		}
	}

	private checkBallBoundaries(gameState: State) {
		//checking if the ball is touching the boundaries, and if so, calculating the angle of rebound
		if (
			gameState.ballPosition.y + BALL_RADIUS + gameState.move.stepY >=
				BOTTOM_BOUNDARY ||
			gameState.ballPosition.y - BALL_RADIUS + gameState.move.stepY <=
				TOP_BOUNDARY
		) {
			gameState.move = {
				stepX: gameState.move.stepX,
				stepY: -gameState.move.stepY,
			};
		}

		if (
			gameState.ballPosition.x - BALL_RADIUS + gameState.move.stepX <=
				LEFT_BOUNDARY ||
			gameState.ballPosition.x + BALL_RADIUS + gameState.move.stepX >=
				RIGHT_BOUNDARY
		) {
			gameState.move = {
				stepX: -gameState.move.stepX,
				stepY: gameState.move.stepY,
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
			gameRoom.gameState.ballPosition = {
				x: gameRoom.gameState.ballPosition.x + gameRoom.gameState.move.stepX,
				y: gameRoom.gameState.ballPosition.y + gameRoom.gameState.move.stepY,
			};
		}
		this.check(gameRoom);
	}

	private checkPlayerBoundaries(
		player: number, //checking the boundaries of players for going beyond the field
		gameState: State
	) {
		if (player === 1) {
			if (gameState.p1 + SKATE_HEIGHT >= SKATE_MAX_Y) return 1;
			if (gameState.p1 <= SKATE_MIN_Y) {
				return 2;
			}
		} else if (player === 2) {
			if (gameState.p2 + SKATE_HEIGHT >= SKATE_MAX_Y) return 3;
			if (gameState.p2 <= SKATE_MIN_Y) return 4;
		}

		return 0;
	}

	private resetPlayer(
		code: number, //return of players to the field, in case of exit
		gameState: State
	) {
		if (code === 1) {
			gameState.p1 = SKATE_MAX_Y - SKATE_HEIGHT;
		}
		if (code === 2) {
			gameState.p1 = SKATE_MIN_Y;
		}
		if (code === 3) {
			gameState.p2 = SKATE_MAX_Y - SKATE_HEIGHT;
		}
		if (code === 4) {
			gameState.p2 = SKATE_MIN_Y;
		}
	}

	private resetBall(gameState: State) {
		gameState.ballPosition = this.placeBall();
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
			(gameRoom.gameState.result[0] === WINNING_SCORE ||
				gameRoom.gameState.result[1] === WINNING_SCORE) &&
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
			gameRoom.gameState.p1 += MOVE_STEP * dir;
		} else {
			gameRoom.gameState.p2 += MOVE_STEP * dir;
		}

		if (this.checkPlayerBoundaries(playerIndex, gameRoom.gameState)) {
			this.resetPlayer(
				this.checkPlayerBoundaries(playerIndex, gameRoom.gameState),
				gameRoom.gameState
			);
		}
	}
}
