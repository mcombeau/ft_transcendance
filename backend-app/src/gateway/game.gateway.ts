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

  // @SubscribeMessage('tick')
  // onTick(@MessageBody() state: any, @ConnectedSocket() socket: ioSocket) {
  //   this.message = state;
  // }
}
