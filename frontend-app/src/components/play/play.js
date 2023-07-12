import React from 'react';
import './styles.css';

class Pong extends React.Component {
  constructor(props) {
    super(props);
    this.delay = 10;
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
      y: 225
    };

    this.state = {
      result: [0, 0],
      p1: 160,
      p2: 160,
      live: true,
      isPaused: false,
      ballPosition: this.defaultBallPosition,
      move: {
        stepX: -1,
        stepY: 1
      }
    };
  }

  randomInitialMove() // pseudo-random ball behavior
  {
    const moves = [
      { stepX: 1, stepY: 1 },
      { stepX: 1, stepY: 2 },
      { stepX: 2, stepY: 1 },
      { stepX: -1, stepY: -1 },
      { stepX: -1, stepY: 1 }
    ];
    let initialMove = moves[Math.floor(Math.random() * moves.length)];
    console.log(initialMove);
    this.setState({ move: initialMove });
  }

  checkGoals() //checking if the ball touches the borders of the goal
  {
    const { ballPosition } = this.state;
    if (
      ballPosition.x - this.ballRadius <= this.p1GateX + this.ballRadius * 2 &&
      ballPosition.y + this.ballRadius >= this.gateY &&
      ballPosition.y - this.ballRadius <= this.gateY + this.gateHeight
    ) {
      this.setState((prevState) => ({
        result: [prevState.result[0], prevState.result[1] + 1]
      }));
      this.resetBall();
      this.randomInitialMove();
    }

    if (
      ballPosition.x + this.ballRadius >= this.p2GateX &&
      ballPosition.y + this.ballRadius >= this.gateY &&
      ballPosition.y - this.ballRadius <= this.gateY + this.gateHeight
    ) {
      this.setState((prevState) => ({
        result: [prevState.result[0] + 1, prevState.result[1]]
      }));
      this.resetBall();
      this.randomInitialMove();
    }
  }

  checkPlayers() //checking if the ball is touching the players, and if so, calculating the angle of rebound
  {
    const { ballPosition, p1, p2 } = this.state;
    if (
      ballPosition.x - this.ballRadius <= this.player1x &&
      ballPosition.y + this.ballRadius >= p1 &&
      ballPosition.y - this.ballRadius <= p1 + this.pHeight
    ) {
      this.setState((prevState) => ({
        move: { stepX: -prevState.move.stepX, stepY: prevState.move.stepY }
      }));
    }

    if (
      ballPosition.x - this.ballRadius >= this.player2x &&
      ballPosition.y + this.ballRadius >= p2 &&
      ballPosition.y - this.ballRadius <= p2 + this.pHeight
    ) {
      this.setState((prevState) => ({
        move: { stepX: -prevState.move.stepX, stepY: prevState.move.stepY }
      }));
    }
  }

  checkBallBoundaries() //checking if the ball is touching the boundaries, and if so, calculating the angle of rebound
  {
    const { ballPosition, move } = this.state;
    const { stepX, stepY } = move;

    if (
      ballPosition.y + this.ballRadius + stepY >= this.bottomBoundary ||
      ballPosition.y - this.ballRadius + stepY <= this.topBoundary
    ) {
      this.setState((prevState) => ({
        move: { stepX: prevState.move.stepX, stepY: -prevState.move.stepY }
      }));
    }

    if (
      ballPosition.x - this.ballRadius + stepX <= this.leftBoundary ||
      ballPosition.x + this.ballRadius + stepX >= this.rightBoundary
    ) {
      this.setState((prevState) => ({
        move: { stepX: -prevState.move.stepX, stepY: prevState.move.stepY }
      }));
    }
  }

  check() {
    this.checkPlayers();
    this.checkGoals();
    this.checkBallBoundaries();
    this.checkGameOver();
  }

  tick() {
    if (this.state.live === true) {
      this.setState((prevState) => ({
        ballPosition: {
          x: prevState.ballPosition.x + prevState.move.stepX,
          y: prevState.ballPosition.y + prevState.move.stepY
        }
      }), () => {
        this.check();
      });
    }
  }

  componentDidMount() //key bindings
  {
    window.addEventListener("keydown", this.handleKeyPress);
    window.addEventListener("keydown", this.handleKeyPress2);
    this.timer = setInterval(() => this.tick(), this.delay);
  }

  componentWillUnmount() //key unbindings
  {
    window.removeEventListener("keydown", this.handleKeyPress);
    window.removeEventListener("keydown", this.handleKeyPress2);
    clearInterval(this.timer);
  }

  checkPlayerBoundaries(player) //checking the boundaries of players for going beyond the field
  {
    const { p1, p2 } = this.state;
    const { pHeight, playerMaxY, playerMinY } = this;

    if (player === 1) {
      if (p1 + pHeight >= playerMaxY ) 
        return 1;
      if(p1 <= playerMinY) {
        return 2;
      };
    } else if (player === 2) {
      if (p2 + pHeight >= playerMaxY)
        return 3;
      if(p2 <= playerMinY)
        return 4;
    }

    return 0;
  }

  resetPlayer(code) //return of players to the field, in case of exit
  {
    const { p1, p2 } = this.state;
    const { pHeight, playerMaxY, playerMinY } = this;
    if (code === 1) {
      this.setState({ p1: playerMaxY - pHeight});
    }
    if (code === 2) {
      this.setState({ p1: playerMinY});
    }
    if (code === 3) {
      this.setState({ p2: playerMaxY- pHeight});
    }
    if (code === 4) {
      this.setState({ p2: playerMinY});
    }
  }

  handleKeyPress = (event) => //player 1 binds
  {
    const step = 7;
    if (event.key === "q") {
      this.setState((prevState) => ({
        p1: prevState.p1 - step
      }), () => {
        if (this.checkPlayerBoundaries(1)) {
          this.resetPlayer(this.checkPlayerBoundaries(1));
        }
      });
    } else if (event.key === "a") {
      this.setState((prevState) => ({
        p1: prevState.p1 + step
      }), () => {
        if (this.checkPlayerBoundaries(1)) {
          this.resetPlayer(this.checkPlayerBoundaries(1));
        }
      });
    }
  };

  handleKeyPress2 = (event) => //player 2 binds
  {
    const step = 7;
    if (event.key === "o") {
      this.setState((prevState) => ({
        p2: prevState.p2 - step
      }), () => {
        if (this.checkPlayerBoundaries(2)) {
          this.resetPlayer(this.checkPlayerBoundaries(2));
        }
      });
    } else if (event.key === "l") {
      this.setState((prevState) => ({
        p2: prevState.p2 + step
      }), () => {
        if (this.checkPlayerBoundaries(2)) {
          this.resetPlayer(this.checkPlayerBoundaries(2));
        }
      });
    }
  };

  resetBall() 
  {
    this.setState({
      ballPosition: this.defaultBallPosition
    });
  }

  restart()
  {
    this.resetBall();
    this.randomInitialMove();
  }

  pause()
  {
    this.setState((prevState) => ({
      live: !prevState.live,
      isPaused: !prevState.isPaused
    }));
  }

  printResult1()
  {
    const { result } = this.state;
    return `${result[0]}`;
  }
  printResult2()
  {
    const { result } = this.state;
    return `${result[1]}`;
  }

  checkGameOver()
  {
    const { result } = this.state;
    if (result[0] === 10 || result[1] === 10)
    {
      this.pause();
    }
  }

  render() {
    const { ballPosition, p1, p2, live, result, } = this.state;
    const isPaused = this.state.isPaused;
    return (
      <div className="App">
        <div className="center-container">
          <div className="result"><span class="res1">{this.printResult1()}</span>:<span class="res2">{this.printResult2()}</span>
            <div className="gameField">
              <div
                className="ball"
                style={{
                  top: ballPosition.y - this.ballRadius,
                 left: ballPosition.x - this.ballRadius
               }}
              />
              <div className="midLine" />
              <div className="midLineHor" />
              <div className="player player1" style={{ top: p1 }} />
              <div className="player player2" style={{ top: p2 }} />
              <div className="gate gate1" />
              <div className="gate gate2" />
          </div>
        </div>
      </div>
      </div>
    );
  }
}

export default Pong;
