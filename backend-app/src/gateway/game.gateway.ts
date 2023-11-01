import { OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket as ioSocket } from 'socket.io';
import { GamesService } from 'src/games/games.service';

type Position = {
  x: number;
  y: number;
};

type Step = {
  stepX: number;
  stepY: number;
};

type State = {
  result: number[];
  p1: number;
  p2: number;
  live: boolean;
  isPaused: boolean;
  ballPosition: Position;
  move: Step;
};

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost'],
  },
})
export class GameGateway implements OnModuleInit {
  constructor(
    @Inject(forwardRef(() => GamesService))
    private gameService: GamesService,
  ) {}
  @WebSocketServer()
  server: Server;
  delay: number;
  player1x: number;
  player2x: number;
  pHeight: number;
  gateHeight: number;
  gateY: number;
  p1GateX: number;
  p2GateX: number;
  playerMaxY: number;
  playerMinY: number;
  ballRadius: number;
  bottomBoundary: number;
  topBoundary: number;
  leftBoundary: number;
  rightBoundary: number;
  defaultBallPosition: { x: number; y: number };
  gameState: State;

  onModuleInit() {
    this.delay = 100;
    this.player1x = 42;
    this.player2x = 660;
    this.pHeight = 80;
    this.gateHeight = 160;
    this.gateY = 100;
    this.p1GateX = 3;
    this.p2GateX = 697;
    this.playerMaxY = 400;
    this.playerMinY = 0;
    this.ballRadius = 10;
    this.bottomBoundary = 410;
    this.topBoundary = 10;
    this.leftBoundary = 5;
    this.rightBoundary = 710;
    this.defaultBallPosition = {
      x: 249,
      y: 225,
    };
    this.gameState = {
      result: [0, 0],
      p1: 160,
      p2: 160,
      live: true,
      isPaused: false,
      ballPosition: this.defaultBallPosition,
      move: {
        stepX: -1,
        stepY: 1,
      },
    };
    this.server.on('connection', (socket) => {
      this.gameState = {
        result: [0, 0],
        p1: 160,
        p2: 160,
        live: true,
        isPaused: false,
        ballPosition: this.defaultBallPosition,
        move: {
          stepX: -1,
          stepY: 1,
        },
      };
      console.log(`[Game Gateway]: A user connected: ${socket.id}`);
      socket.on('disconnect', () => {
        console.log('a user disconnected');
      });
    });
    setInterval(() => {
      this.gameState.ballPosition = {
        x: this.gameState.ballPosition.x + this.gameState.move.stepX,
        y: this.gameState.ballPosition.y + this.gameState.move.stepY,
      };
      this.server.emit('tick', this.gameState);
    }, this.delay);
  }

  randomInitialMove() {
    // pseudo-random ball behavior
    const moves = [
      { stepX: 1, stepY: 1 },
      { stepX: 1, stepY: 2 },
      { stepX: 2, stepY: 1 },
      { stepX: -1, stepY: -1 },
      { stepX: -1, stepY: 1 },
    ];
    let initialMove = moves[Math.floor(Math.random() * moves.length)];
    console.log(initialMove);
    this.gameState.move = initialMove;
  }

  checkGoals() {
    //checking if the ball touches the borders of the goal
    if (
      this.gameState.ballPosition.x - this.ballRadius <=
        this.p1GateX + this.ballRadius * 2 &&
      this.gameState.ballPosition.y + this.ballRadius >= this.gateY &&
      this.gameState.ballPosition.y - this.ballRadius <=
        this.gateY + this.gateHeight
    ) {
      this.gameState.result = [
        this.gameState.result[0],
        this.gameState.result[1] + 1,
      ];
      this.resetBall();
      this.randomInitialMove();
    }

    if (
      this.gameState.ballPosition.x + this.ballRadius >= this.p2GateX &&
      this.gameState.ballPosition.y + this.ballRadius >= this.gateY &&
      this.gameState.ballPosition.y - this.ballRadius <=
        this.gateY + this.gateHeight
    ) {
      this.gameState.result = [
        this.gameState.result[0] + 1,
        this.gameState.result[1],
      ];
      this.resetBall();
      this.randomInitialMove();
    }
  }

  checkPlayers() {
    //checking if the ball is touching the players, and if so, calculating the angle of rebound
    if (
      this.gameState.ballPosition.x - this.ballRadius <= this.player1x &&
      this.gameState.ballPosition.y + this.ballRadius >= this.gameState.p1 &&
      this.gameState.ballPosition.y - this.ballRadius <=
        this.gameState.p1 + this.pHeight
    ) {
      this.gameState.move = {
        stepX: -this.gameState.move.stepX,
        stepY: this.gameState.move.stepY,
      };
    }

    if (
      this.gameState.ballPosition.x - this.ballRadius >= this.player2x &&
      this.gameState.ballPosition.y + this.ballRadius >= this.gameState.p2 &&
      this.gameState.ballPosition.y - this.ballRadius <=
        this.gameState.p2 + this.pHeight
    ) {
      this.gameState.move = {
        stepX: -this.gameState.move.stepX,
        stepY: this.gameState.move.stepY,
      };
    }
  }

  checkBallBoundaries() {
    //checking if the ball is touching the boundaries, and if so, calculating the angle of rebound
    if (
      this.gameState.ballPosition.y +
        this.ballRadius +
        this.gameState.move.stepY >=
        this.bottomBoundary ||
      this.gameState.ballPosition.y -
        this.ballRadius +
        this.gameState.move.stepY <=
        this.topBoundary
    ) {
      this.gameState.move = {
        stepX: this.gameState.move.stepX,
        stepY: -this.gameState.move.stepY,
      };
    }

    if (
      this.gameState.ballPosition.x -
        this.ballRadius +
        this.gameState.move.stepX <=
        this.leftBoundary ||
      this.gameState.ballPosition.x +
        this.ballRadius +
        this.gameState.move.stepX >=
        this.rightBoundary
    ) {
      this.gameState.move = {
        stepX: -this.gameState.move.stepX,
        stepY: this.gameState.move.stepY,
      };
    }
  }

  check() {
    this.checkPlayers();
    this.checkGoals();
    this.checkBallBoundaries();
    this.checkGameOver();
  }

  tick() {
    if (this.gameState.live === true) {
      this.gameState.ballPosition = {
        x: this.gameState.ballPosition.x + this.gameState.move.stepX,
        y: this.gameState.ballPosition.y + this.gameState.move.stepY,
      };
    }
    this.check();
  }

  checkPlayerBoundaries(
    player, //checking the boundaries of players for going beyond the field
  ) {
    const { p1, p2 } = this.gameState;
    const { pHeight, playerMaxY, playerMinY } = this;

    if (player === 1) {
      if (p1 + pHeight >= playerMaxY) return 1;
      if (p1 <= playerMinY) {
        return 2;
      }
    } else if (player === 2) {
      if (p2 + pHeight >= playerMaxY) return 3;
      if (p2 <= playerMinY) return 4;
    }

    return 0;
  }

  resetPlayer(
    code, //return of players to the field, in case of exit
  ) {
    const { p1, p2 } = this.gameState;
    const { pHeight, playerMaxY, playerMinY } = this;
    if (code === 1) {
      this.gameState.p1 = playerMaxY - pHeight;
    }
    if (code === 2) {
      this.gameState.p1 = playerMinY;
    }
    if (code === 3) {
      this.gameState.p2 = playerMaxY - pHeight;
    }
    if (code === 4) {
      this.gameState.p2 = playerMinY;
    }
  }

  resetBall() {
    this.gameState.ballPosition = this.defaultBallPosition;
  }

  restart() {
    this.resetBall();
    this.randomInitialMove();
  }

  pause() {
    this.gameState.live = !this.gameState.live;
    this.gameState.isPaused = !this.gameState.isPaused;
  }

  checkGameOver() {
    const { result } = this.gameState;
    if (result[0] === 10 || result[1] === 10) {
      this.pause();
    }
  }

  // @SubscribeMessage('tick')
  // onTick(@MessageBody() state: any, @ConnectedSocket() socket: ioSocket) {
  //   this.message = state;
  // }
}
