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
import { MessageBody } from '@nestjs/websockets';
import { ChatGateway } from './chat.gateway';

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
  gameState: State;
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
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
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
  step: number;
  initialGameState: State;
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
    this.initialGameState = {
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
      const myGameRoom: GameRoom = await this.joinRoom(socket, user.userID);
      setInterval(() => {
        this.tick(myGameRoom.gameState);
        this.server.emit('tick', myGameRoom.gameState);
      }, this.delay);
    });
  }

  // TODO: function start game

  private async getRoom(userID: number) {
    // TODO: remove unused rooms ?
    for (let i = this.gameRooms.length - 1; i >= 0; i--) {
      var gameRoom = this.gameRooms[i];
      if (gameRoom.player1ID === userID) {
        return gameRoom.socketRoomID;
      } else if (gameRoom.player2ID && gameRoom.player2ID === userID) {
        return gameRoom.socketRoomID;
      }
    }
    return null;
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
      gameState: this.initialGameState,
    };
  }

  private async joinRoom(socket: Socket, userID: number) {
    socket.data.userID = userID;
    // If there is no gameroom create and join one
    if (this.gameRooms.length === 0) {
      const newGameRoom = await this.createRoom(socket, userID);
      this.gameRooms.push(newGameRoom);
      return newGameRoom;
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
      return lastGameRoom;
    } else {
      const newGameRoom = await this.createRoom(socket, userID);
      this.gameRooms.push(newGameRoom);
      return newGameRoom;
    }
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
    let initialMove = moves[Math.floor(Math.random() * moves.length)];
    gameState.move = initialMove;
  }

  checkGoals(gameState: State) {
    //checking if the ball touches the borders of the goal
    if (
      gameState.ballPosition.x - this.ballRadius <=
        this.p1GateX + this.ballRadius * 2 &&
      gameState.ballPosition.y + this.ballRadius >= this.gateY &&
      gameState.ballPosition.y - this.ballRadius <= this.gateY + this.gateHeight
    ) {
      gameState.result = [gameState.result[0], gameState.result[1] + 1];
      this.resetBall(gameState);
      this.randomInitialMove(gameState);
    }

    if (
      gameState.ballPosition.x + this.ballRadius >= this.p2GateX &&
      gameState.ballPosition.y + this.ballRadius >= this.gateY &&
      gameState.ballPosition.y - this.ballRadius <= this.gateY + this.gateHeight
    ) {
      gameState.result = [gameState.result[0] + 1, gameState.result[1]];
      this.resetBall(gameState);
      this.randomInitialMove(gameState);
    }
  }

  checkPlayers(gameState: State) {
    //checking if the ball is touching the players, and if so, calculating the angle of rebound
    if (
      gameState.ballPosition.x - this.ballRadius <= this.player1x &&
      gameState.ballPosition.y + this.ballRadius >= gameState.p1 &&
      gameState.ballPosition.y - this.ballRadius <= gameState.p1 + this.pHeight
    ) {
      gameState.move = {
        stepX: -gameState.move.stepX,
        stepY: gameState.move.stepY,
      };
    }

    if (
      gameState.ballPosition.x - this.ballRadius >= this.player2x &&
      gameState.ballPosition.y + this.ballRadius >= gameState.p2 &&
      gameState.ballPosition.y - this.ballRadius <= gameState.p2 + this.pHeight
    ) {
      gameState.move = {
        stepX: -gameState.move.stepX,
        stepY: gameState.move.stepY,
      };
    }
  }

  checkBallBoundaries(gameState: State) {
    //checking if the ball is touching the boundaries, and if so, calculating the angle of rebound
    if (
      gameState.ballPosition.y + this.ballRadius + gameState.move.stepY >=
        this.bottomBoundary ||
      gameState.ballPosition.y - this.ballRadius + gameState.move.stepY <=
        this.topBoundary
    ) {
      gameState.move = {
        stepX: gameState.move.stepX,
        stepY: -gameState.move.stepY,
      };
    }

    if (
      gameState.ballPosition.x - this.ballRadius + gameState.move.stepX <=
        this.leftBoundary ||
      gameState.ballPosition.x + this.ballRadius + gameState.move.stepX >=
        this.rightBoundary
    ) {
      gameState.move = {
        stepX: -gameState.move.stepX,
        stepY: gameState.move.stepY,
      };
    }
  }

  check(gameState: State) {
    this.checkPlayers(gameState);
    this.checkGoals(gameState);
    this.checkBallBoundaries(gameState);
    this.checkGameOver(gameState);
  }

  tick(gameState: State) {
    if (gameState.live === true) {
      gameState.ballPosition = {
        x: gameState.ballPosition.x + gameState.move.stepX,
        y: gameState.ballPosition.y + gameState.move.stepY,
      };
    }
    this.check(gameState);
  }

  checkPlayerBoundaries(
    player: number, //checking the boundaries of players for going beyond the field
    gameState: State,
  ) {
    if (player === 1) {
      if (gameState.p1 + this.pHeight >= this.playerMaxY) return 1;
      if (gameState.p1 <= this.playerMinY) {
        return 2;
      }
    } else if (player === 2) {
      if (gameState.p2 + this.pHeight >= this.playerMaxY) return 3;
      if (gameState.p2 <= this.playerMinY) return 4;
    }

    return 0;
  }

  resetPlayer(
    code: number, //return of players to the field, in case of exit
    gameState: State,
  ) {
    if (code === 1) {
      gameState.p1 = this.playerMaxY - this.pHeight;
    }
    if (code === 2) {
      gameState.p1 = this.playerMinY;
    }
    if (code === 3) {
      gameState.p2 = this.playerMaxY - this.pHeight;
    }
    if (code === 4) {
      gameState.p2 = this.playerMinY;
    }
  }

  resetBall(gameState: State) {
    gameState.ballPosition = this.defaultBallPosition;
  }

  restart(gameState: State) {
    this.resetBall(gameState);
    this.randomInitialMove(gameState);
  }

  pause(gameState: State) {
    gameState.live = !gameState.live;
    gameState.isPaused = !gameState.isPaused;
  }

  checkGameOver(gameState: State) {
    const { result } = gameState;
    if (result[0] === 10 || result[1] === 10) {
      // TODO: finish game and insert in db
      this.pause(gameState);
    }
  }

  @SubscribeMessage('up')
  async onUp(@MessageBody() token: string) {
    const userID: number = await this.chatGateway.checkIdentity(token);
    // TODO: maybe change the way we get gamerooms and id them
    const gameRoom: GameRoom = this.gameRooms[await this.getRoom(userID)];
    gameRoom.gameState.p1 -= this.step;
    if (this.checkPlayerBoundaries(1, gameRoom.gameState)) {
      this.resetPlayer(
        this.checkPlayerBoundaries(1, gameRoom.gameState),
        gameRoom.gameState,
      );
    }
  }

  @SubscribeMessage('down')
  async onDown(@MessageBody() token: string) {
    const userID: number = await this.chatGateway.checkIdentity(token);
    const gameRoom: GameRoom = this.gameRooms[await this.getRoom(userID)];
    gameRoom.gameState.p1 += this.step;
    if (this.checkPlayerBoundaries(1, gameRoom.gameState)) {
      this.resetPlayer(
        this.checkPlayerBoundaries(1, gameRoom.gameState),
        gameRoom.gameState,
      );
    }
  }

  @SubscribeMessage('up2')
  async onUp2(@MessageBody() token: string) {
    const userID: number = await this.chatGateway.checkIdentity(token);
    const gameRoom: GameRoom = this.gameRooms[await this.getRoom(userID)];
    gameRoom.gameState.p2 -= this.step;
    if (this.checkPlayerBoundaries(2, gameRoom.gameState)) {
      this.resetPlayer(
        this.checkPlayerBoundaries(2, gameRoom.gameState),
        gameRoom.gameState,
      );
    }
  }

  @SubscribeMessage('down2')
  async onDown2(@MessageBody() token: string) {
    const userID: number = await this.chatGateway.checkIdentity(token);
    const gameRoom: GameRoom = this.gameRooms[await this.getRoom(userID)];
    gameRoom.gameState.p2 -= this.step;
    if (this.checkPlayerBoundaries(2, gameRoom.gameState)) {
      this.resetPlayer(
        this.checkPlayerBoundaries(2, gameRoom.gameState),
        gameRoom.gameState,
      );
    }
  }
}
