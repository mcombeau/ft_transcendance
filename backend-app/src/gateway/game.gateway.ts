import { OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import {
  ConnectedSocket,
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
import { UserEntity } from 'src/users/entities/user.entity';

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
  player1Username: string;
  player2ID?: number;
  player2Username?: string;
  socketRoomID: string;
  gameState: State;
  interval: NodeJS.Timer;
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
  step: number;
  gameRooms: GameRoom[];

  onModuleInit() {
    this.delay = 13;
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
        `[Game Gateway]: A user connected: ${user.username} - ${user.userID} (${socket.id})`,
      );
      socket.broadcast.emit('connection event'); // TODO: probably remove
      this.reconnect(socket, user.userID);
      socket.on('disconnect', () => {
        console.log(
          `[Game Gateway]: A user disconnected: ${user.username} - ${user.userID} (${socket.id})`,
        );
        socket.broadcast.emit('disconnection event');
      });
    });
  }

  private startGame(gameRoom: GameRoom) {
    console.log('[Game Gateway]: Game started');
    this.server.to(gameRoom.socketRoomID).emit('start game');
    this.randomInitialMove(gameRoom.gameState);

    gameRoom.interval = setInterval(() => {
      this.tick(gameRoom);
      this.server.to(gameRoom.socketRoomID).emit('tick', gameRoom);
    }, this.delay);
  }

  private stopGame(gameRoom: GameRoom) {
    console.log('[Game Gateway]: Game stopped');
    clearInterval(gameRoom.interval);
    this.server.in(gameRoom.socketRoomID).socketsLeave(gameRoom.socketRoomID);
    this.gameRooms = this.gameRooms.filter(
      (gr: GameRoom) => gr.socketRoomID !== gameRoom.socketRoomID,
    );
  }

  private async getRoom(userID: number) {
    // TODO: remove unused rooms ?
    for (let i = this.gameRooms.length - 1; i >= 0; i--) {
      const gameRoom = this.gameRooms[i];
      if (gameRoom.player1ID === userID) {
        return gameRoom;
      } else if (gameRoom.player2ID && gameRoom.player2ID === userID) {
        return gameRoom;
      }
    }
    return null;
  }

  private placeBall() {
    return { x: 250, y: 250 };
  }

  private createGameState() {
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

  private async reconnect(socket: Socket, userID: number) {
    let myGameRoom: GameRoom = await this.getRoom(userID);
    if (myGameRoom) {
      await socket.join(myGameRoom.socketRoomID);
      console.log(
        '[Game Gateway]:',
        'Setting up user',
        userID,
        'to join back gameroom',
        myGameRoom.socketRoomID,
      );
      return true;
    }
    return false;
  }

  private async createRoom(socket: Socket, user: any) {
    const socketRoomID = this.gameRooms.length.toString();

    console.log(
      '[Game Gateway]: Create new GameRoom of id',
      socketRoomID,
      'with player',
      user.userID,
      'of username',
      user.username,
    );
    await socket.join(socketRoomID);
    return {
      player1ID: user.userID,
      player1Username: user.username,
      socketRoomID: socketRoomID,
      gameState: this.createGameState(),
      interval: null,
    };
  }

  private async joinRoom(socket: Socket, user: any) {
    socket.data.userID = user.userID;
    // If there is no gameroom create and join one
    if (this.gameRooms.length === 0) {
      const newGameRoom = await this.createRoom(socket, user);
      this.gameRooms.push(newGameRoom);
      return newGameRoom;
    }
    // If the last gameroom is not full join it
    const lastGameRoom = this.gameRooms[this.gameRooms.length - 1];
    // If the last gameroom is full create a new one

    if (!lastGameRoom.player2ID) {
      lastGameRoom.player2ID = user.userID;
      lastGameRoom.player2Username = user.username;
      await socket.join(lastGameRoom.socketRoomID);
      console.log(
        '[Game Gateway] User',
        user.userID,
        'of username',
        user.username,
        'joins GameRoom of id',
        lastGameRoom.socketRoomID,
      );
      this.startGame(lastGameRoom);
      return lastGameRoom;
    } else {
      const newGameRoom = await this.createRoom(socket, user);
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
    const initialMove = moves[Math.floor(Math.random() * moves.length)];
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

  tick(gameRoom: GameRoom) {
    if (gameRoom.gameState.live === true) {
      gameRoom.gameState.ballPosition = {
        x: gameRoom.gameState.ballPosition.x + gameRoom.gameState.move.stepX,
        y: gameRoom.gameState.ballPosition.y + gameRoom.gameState.move.stepY,
      };
    }
    this.check(gameRoom.gameState);
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
    gameState.ballPosition = this.placeBall();
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
  async onUp(@ConnectedSocket() socket: Socket, @MessageBody() token: string) {
    const userID: number = await this.chatGateway.checkIdentity(token, socket);

    const gameRoom: GameRoom = await this.getRoom(userID);

    let playerIndex = 1;
    if (gameRoom.player1ID === userID) {
      gameRoom.gameState.p1 -= this.step;
    } else {
      playerIndex = 2;
      gameRoom.gameState.p2 -= this.step;
    }

    if (this.checkPlayerBoundaries(playerIndex, gameRoom.gameState)) {
      this.resetPlayer(
        this.checkPlayerBoundaries(playerIndex, gameRoom.gameState),
        gameRoom.gameState,
      );
    }
  }

  @SubscribeMessage('down')
  async onDown(
    @ConnectedSocket() socket: Socket,
    @MessageBody() token: string,
  ) {
    const userID: number = await this.chatGateway.checkIdentity(token, socket);
    const gameRoom: GameRoom = await this.getRoom(userID);

    let playerIndex = 1;
    if (gameRoom.player1ID === userID) {
      gameRoom.gameState.p1 += this.step;
    } else {
      playerIndex = 2;
      gameRoom.gameState.p2 += this.step;
    }
    if (this.checkPlayerBoundaries(playerIndex, gameRoom.gameState)) {
      this.resetPlayer(
        this.checkPlayerBoundaries(playerIndex, gameRoom.gameState),
        gameRoom.gameState,
      );
    }
  }

  @SubscribeMessage('waiting')
  async onWaiting(
    @ConnectedSocket() socket: Socket,
    @MessageBody() token: string,
  ) {
    // TODO: check that this does not work if not connected (try/catch ?)
    const user = await this.authService
      .validateToken(token)
      .catch(() => {
        return false;
      })
      .finally(() => {
        return true;
      });

    if (!(await this.reconnect(socket, user.userID))) {
      let myGameRoom = await this.joinRoom(socket, user);
      console.log(
        '[Game Gateway]:',
        'Setting up user',
        user.userID,
        'to receive messages from gameroom',
        myGameRoom.socketRoomID,
      );
    }
  }

  @SubscribeMessage('leave game')
  async onLeaveGame(
    @ConnectedSocket() socket: Socket,
    @MessageBody() token: string,
  ) {
    // TODO: check that this does not work if not connected (try/catch ?)

    const userID: number = await this.chatGateway.checkIdentity(token, socket);
    const gameRoom: GameRoom = await this.getRoom(userID);
    console.log(
      `[Game Gateway]: User ${userID} left gameroom ${gameRoom.socketRoomID}`,
    );

    this.server.to(gameRoom.socketRoomID).emit('leave game', userID);
    this.stopGame(gameRoom);
  }
}
