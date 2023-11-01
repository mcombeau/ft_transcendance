import { useCallback, useContext, useEffect, useState } from "react";
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
  const defaultBallPosition: Position = {
    x: 249,
    y: 225,
  };
  const [state, setState] = useState<State>({
    result: [0, 0],
    p1: 160,
    p2: 160,
    live: true,
    isPaused: false,
    ballPosition: defaultBallPosition,
    move: {
      stepX: -10,
      stepY: 10,
    },
  });
  const pHeight: number = 80;
  const playerMaxY: number = 400;
  const playerMinY: number = 0;
  const ballRadius: number = 10;
  const socket = useContext(WebSocketContext);

  function componentDidMount() {
    //key bindings
    console.log("Component did mount");
    window.addEventListener("keydown", handleKeyPress);
    window.addEventListener("keydown", handleKeyPress2);
  }

  function componentWillUnmount() {
    //key unbindings
    console.log("Component will unmount");
    window.removeEventListener("keydown", handleKeyPress);
    window.removeEventListener("keydown", handleKeyPress2);
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

    console.log("No player is out of bounds");
    return 0;
  }

  function resetPlayer(
    code: number //return of players to the field, in case of exit
  ) {
    if (code === 1) {
      setState((prevState) => ({
        ...prevState,
        p1: playerMaxY - pHeight,
      }));
    }
    if (code === 2) {
      setState((prevState) => ({ ...prevState, p1: playerMinY }));
    }
    if (code === 3) {
      setState((prevState) => ({ ...prevState, p2: playerMaxY - pHeight }));
    }
    if (code === 4) {
      setState((prevState) => ({ ...prevState, p2: playerMinY }));
    }
  }

  function handleKeyPress(
    event: any //player 1 binds
  ) {
    console.log("handling key press");
    const step = 7;
    if (event.key === "q") {
      console.log("Handling Q");
      setState((prevState) => ({
        ...prevState,
        p1: prevState.p1 - step,
      }));
      if (checkPlayerBoundaries(1)) {
        resetPlayer(checkPlayerBoundaries(1));
      }
    } else if (event.key === "a") {
      console.log("Handling A");
      setState((prevState) => ({
        ...prevState,
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
    console.log("handling key press");
    const step = 7;
    if (event.key === "o") {
      console.log("Handling O");
      setState((prevState) => ({
        ...prevState,
        p2: prevState.p2 - step,
      }));
      if (checkPlayerBoundaries(2)) {
        resetPlayer(checkPlayerBoundaries(2));
      }
    } else if (event.key === "l") {
      console.log("Handling L");
      setState((prevState) => ({
        ...prevState,
        p2: prevState.p2 + step,
      }));
      if (checkPlayerBoundaries(2)) {
        resetPlayer(checkPlayerBoundaries(2));
      }
    }
  }

  useEffect(() => {
    console.log("Init socket");
    socket.on("tick", (state: State) => {
      console.log("received tick");
      console.log(state);
      setState(state);
    });
    return () => {
      console.log("Unregistering sockets");
      socket.off("tick");
    };
  }, []);

  useEffect(() => {
    componentDidMount();
    return () => {
      componentWillUnmount();
    };
  }, []);

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
