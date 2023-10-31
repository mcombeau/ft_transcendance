import { useContext, useEffect, useState } from "react";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import "./styles.css";

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

function Play() {
  const [defaultBallPosition, setDefaultBallPosition] = useState<Position>({
    x: 249,
    y: 225,
  });
  const [state, setState] = useState<State>({
    result: [0, 0],
    p1: 160,
    p2: 160,
    live: true,
    isPaused: false,
    ballPosition: defaultBallPosition,
    move: {
      stepX: -1,
      stepY: 1,
    },
  });
  const [otherState, setOtherState] = useState<State>();
  const [delay, setDelay] = useState<number>(10);
  const [player1x, setPlayer1x] = useState<number>(42);
  const [player2x, setPlayer2x] = useState<number>(660);
  const [pHeight, setPHeight] = useState<number>(80);
  const [gateHeight, setGateHeight] = useState<number>(160);
  const [gateY, setGateY] = useState<number>(100);
  const [p1GateX, setP1GateX] = useState<number>(3);
  const [p2GateX, setP2GateX] = useState<number>(697);
  const [playerMaxY, setPlayerMaxY] = useState<number>(400);
  const [playerMinY, setPlayerMinY] = useState<number>(0);
  const [ballRadius, setBallRadius] = useState<number>(10);
  const [bottomBoundary, setBottomBoundary] = useState<number>(410);
  const [topBoundary, setTopBoundary] = useState<number>(10);
  const [leftBoundary, setLeftBoundary] = useState<number>(5);
  const [rightBoundary, setRightBoundary] = useState<number>(710);
  const [timer, setTimer] = useState<NodeJS.Timeout>();
  const socket = useContext(WebSocketContext);
  const moves = [
    { stepX: 1, stepY: 1 },
    { stepX: 1, stepY: 2 },
    { stepX: 2, stepY: 1 },
    { stepX: -1, stepY: -1 },
    { stepX: -1, stepY: 1 },
  ];

  function randomInitialMove() {
    let initialMove = moves[Math.floor(Math.random() * moves.length)];
    console.log(initialMove);
    setState({ ...state, move: initialMove });
  }

  function checkGoals() {
    //checking if the ball touches the borders of the goal
    if (
      state.ballPosition.x - ballRadius <= p1GateX + ballRadius * 2 &&
      state.ballPosition.y + ballRadius >= gateY &&
      state.ballPosition.y - ballRadius <= gateY + gateHeight
    ) {
      setState((prevState) => ({
        ...prevState,
        result: [prevState.result[0], prevState.result[1] + 1],
      }));
      resetBall();
      randomInitialMove();
    }

    if (
      state.ballPosition.x + ballRadius >= p2GateX &&
      state.ballPosition.y + ballRadius >= gateY &&
      state.ballPosition.y - ballRadius <= gateY + gateHeight
    ) {
      setState((prevState) => ({
        ...prevState,
        result: [prevState.result[0] + 1, prevState.result[1]],
      }));
      resetBall();
      randomInitialMove();
    }
  }

  function checkPlayers() {
    //checking if the ball is touching the players, and if so, calculating the angle of rebound
    if (
      state.ballPosition.x - ballRadius <= player1x &&
      state.ballPosition.y + ballRadius >= state.p1 &&
      state.ballPosition.y - ballRadius <= state.p1 + pHeight
    ) {
      setState((prevState) => ({
        ...state,
        move: { stepX: -prevState.move.stepX, stepY: prevState.move.stepY },
      }));
    }

    if (
      state.ballPosition.x - ballRadius >= player2x &&
      state.ballPosition.y + ballRadius >= state.p2 &&
      state.ballPosition.y - ballRadius <= state.p2 + pHeight
    ) {
      setState((prevState) => ({
        ...state,
        move: { stepX: -prevState.move.stepX, stepY: prevState.move.stepY },
      }));
    }
  }

  function checkBallBoundaries() {
    //checking if the ball is touching the boundaries, and if so, calculating the angle of rebound

    if (
      state.ballPosition.y + ballRadius + state.move.stepY >= bottomBoundary ||
      state.ballPosition.y - ballRadius + state.move.stepY <= topBoundary
    ) {
      setState((prevState) => ({
        ...state,
        move: { stepX: prevState.move.stepX, stepY: -prevState.move.stepY },
      }));
    }

    if (
      state.ballPosition.x - ballRadius + state.move.stepX <= leftBoundary ||
      state.ballPosition.x + ballRadius + state.move.stepX >= rightBoundary
    ) {
      setState((prevState) => ({
        ...state,
        move: { stepX: -prevState.move.stepX, stepY: prevState.move.stepY },
      }));
    }
  }

  function check() {
    socket.emit("tick", state);
    checkPlayers();
    checkGoals();
    checkBallBoundaries();
    checkGameOver();
  }

  function tick() {
    if (state.live === true) {
      setState((prevState) => ({
        ...state,
        ballPosition: {
          x: prevState.ballPosition.x + prevState.move.stepX,
          y: prevState.ballPosition.y + prevState.move.stepY,
        },
      }));
      check();
    }
  }

  function componentDidMount() {
    //key bindings
    window.addEventListener("keydown", handleKeyPress);
    window.addEventListener("keydown", handleKeyPress2);
    setTimer(setInterval(() => tick(), delay));
  }

  function componentWillUnmount() {
    //key unbindings
    window.removeEventListener("keydown", handleKeyPress);
    window.removeEventListener("keydown", handleKeyPress2);
    clearInterval(timer);
  }

  function checkPlayerBoundaries(
    player: number //checking the boundaries of players for going beyond the field
  ) {
    if (player === 1) {
      if (state.p1 + pHeight >= playerMaxY) return 1;
      if (state.p1 <= playerMinY) {
        return 2;
      }
    } else if (player === 2) {
      if (state.p2 + pHeight >= playerMaxY) return 3;
      if (state.p2 <= playerMinY) return 4;
    }

    return 0;
  }

  function resetPlayer(
    code: number //return of players to the field, in case of exit
  ) {
    if (code === 1) {
      setState({ ...state, p1: playerMaxY - pHeight });
    }
    if (code === 2) {
      setState({ ...state, p1: playerMinY });
    }
    if (code === 3) {
      setState({ ...state, p2: playerMaxY - pHeight });
    }
    if (code === 4) {
      setState({ ...state, p2: playerMinY });
    }
  }

  function handleKeyPress(
    event: any //player 1 binds
  ) {
    const step = 7;
    if (event.key === "q") {
      setState((prevState) => ({
        ...state,
        p1: prevState.p1 - step,
      }));
      if (checkPlayerBoundaries(1)) {
        resetPlayer(checkPlayerBoundaries(1));
      }
    } else if (event.key === "a") {
      setState((prevState) => ({
        ...state,
        p1: prevState.p1 + step,
      }));
      if (checkPlayerBoundaries(1)) {
        resetPlayer(checkPlayerBoundaries(1));
      }
    }
  }

  function handleKeyPress2(
    event: any //player 2 binds
  ) {
    const step = 7;
    if (event.key === "o") {
      setState((prevState) => ({
        ...state,
        p2: prevState.p2 - step,
      }));
      if (checkPlayerBoundaries(2)) {
        resetPlayer(checkPlayerBoundaries(2));
      }
    } else if (event.key === "l") {
      setState((prevState) => ({
        ...state,
        p2: prevState.p2 + step,
      }));
      if (checkPlayerBoundaries(2)) {
        resetPlayer(checkPlayerBoundaries(2));
      }
    }
  }

  function resetBall() {
    setState({
      ...state,
      ballPosition: defaultBallPosition,
    });
  }

  function restart() {
    resetBall();
    randomInitialMove();
  }

  function pause() {
    setState((prevState) => ({
      ...state,
      live: !prevState.live,
      isPaused: !prevState.isPaused,
    }));
  }

  function checkGameOver() {
    if (state.result[0] === 10 || state.result[1] === 10) {
      pause();
    }
  }

  useEffect(() => {
    socket.emit("test");
    // TODO: setup this properly

    socket.on("tick", (state: State) => {
      setOtherState(state);
      console.log(state);
    });
  }, []);

  useEffect(() => {
    componentDidMount();
    return componentWillUnmount();
  }, []);

  useEffect(() => {
    tick();
  }, [timer]);

  return (
    <div className="App">
      <div className="center-container">
        <div className="result">
          <span className="res1">{state.result[0]}</span>:
          <span className="res2">{state.result[1]}</span>
          <div className="gameField">
            <div
              className="ball"
              style={{
                top: state.ballPosition.y - ballRadius,
                left: state.ballPosition.x - ballRadius,
              }}
            />
            <div className="midLine" />
            <div className="midLineHor" />
            <div className="player player1" style={{ top: state.p1 }} />
            <div className="player player2" style={{ top: state.p2 }} />
            <div className="gate gate1" />
            <div className="gate gate2" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Play;
