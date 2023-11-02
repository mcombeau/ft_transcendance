import { OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { GamesService } from 'src/games/games.service';
import { AuthService } from 'src/auth/auth.service';
import { Socket } from 'socket.io';

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

type GameRoom = {
  player1ID: number;
  player2ID?: number;
  socketRoomID: string;
};

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost'],
  },
})
export class GameGateway implements OnModuleInit {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
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
  step: number;
  gameRooms: GameRoom[];

  onModuleInit() {
    this.delay = 5;
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
    this.step = 7;
    this.gameRooms = [];
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
    this.server.on('connection', async (socket) => {
      const token = socket.handshake.headers.authorization.split(' ')[1];
      const user = await this.authService
        .validateToken(token)
        .catch(() => {
          return false;
        })
        .finally(() => {
          return true;
        });

      console.log(
        `[Chat Gateway]: A user connected: ${user.username} - ${user.userID} (${socket.id})`,
      );
      socket.broadcast.emit('connection event'); // TODO: probably remove
      socket.on('disconnect', () => {
        console.log(
          `[Chat Gateway]: A user disconnected: ${user.username} - ${user.userID} (${socket.id})`,
        );
        socket.broadcast.emit('disconnection event');
      });
      await this.joinRoom(socket, user.userID);
    });
    setInterval(() => {
      this.tick();
      this.server.emit('tick', this.gameState);
    }, this.delay);
  }

  private async createRoom(socket: Socket, userID: number) {
    const socketRoomID = this.gameRooms.length.toString();
    console.log(
      '[Game Gateway] Create new GameRoom of id',
      socketRoomID,
      'with player',
      userID,
    );
    await socket.join(socketRoomID);
    return {
      player1ID: userID,
      socketRoomID: socketRoomID,
    };
  }

  private async joinRoom(socket: Socket, userID: number) {
    socket.data.userID = userID;
    // If there is no gameroom create and join one
    if (this.gameRooms.length === 0) {
      const newGameRoom = await this.createRoom(socket, userID);
      this.gameRooms.push(newGameRoom);
      return;
    }
    // If the last gameroom is not full join it
    const lastGameRoom = this.gameRooms[this.gameRooms.length - 1];
    // If the last gameroom is full create a new one
    if (!lastGameRoom.player2ID) {
      lastGameRoom.player2ID = userID;
      await socket.join(lastGameRoom.socketRoomID);
      console.log(
        '[Game Gateway] User',
        userID,
        'joins GameRoom of id',
        lastGameRoom.socketRoomID,
      );
    } else {
      const newGameRoom = await this.createRoom(socket, userID);
      this.gameRooms.push(newGameRoom);
    }
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
    player: number, //checking the boundaries of players for going beyond the field
  ) {
    if (player === 1) {
      if (this.gameState.p1 + this.pHeight >= this.playerMaxY) return 1;
      if (this.gameState.p1 <= this.playerMinY) {
        return 2;
      }
    } else if (player === 2) {
      if (this.gameState.p2 + this.pHeight >= this.playerMaxY) return 3;
      if (this.gameState.p2 <= this.playerMinY) return 4;
    }

    return 0;
  }

  resetPlayer(
    code: number, //return of players to the field, in case of exit
  ) {
    if (code === 1) {
      this.gameState.p1 = this.playerMaxY - this.pHeight;
    }
    if (code === 2) {
      this.gameState.p1 = this.playerMinY;
    }
    if (code === 3) {
      this.gameState.p2 = this.playerMaxY - this.pHeight;
    }
    if (code === 4) {
      this.gameState.p2 = this.playerMinY;
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
      // TODO: finish game and insert in db
      this.pause();
    }
  }

  @SubscribeMessage('up')
  onUp() {
    this.gameState.p1 -= this.step;
    if (this.checkPlayerBoundaries(1)) {
      this.resetPlayer(this.checkPlayerBoundaries(1));
    }
  }

  @SubscribeMessage('down')
  onDown() {
    this.gameState.p1 += this.step;
    if (this.checkPlayerBoundaries(1)) {
      this.resetPlayer(this.checkPlayerBoundaries(1));
    }
  }

  @SubscribeMessage('up2')
  onUp2() {
    this.gameState.p2 -= this.step;
    if (this.checkPlayerBoundaries(2)) {
      this.resetPlayer(this.checkPlayerBoundaries(2));
    }
  }

  @SubscribeMessage('down2')
  onDown2() {
    this.gameState.p2 += this.step;
    if (this.checkPlayerBoundaries(2)) {
      this.resetPlayer(this.checkPlayerBoundaries(2));
    }
  }
}
