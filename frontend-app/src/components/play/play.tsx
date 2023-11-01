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
  const ballRadius: number = 10;
  const socket = useContext(WebSocketContext);

  function componentDidMount() {
    console.log("Component did mount");
    window.addEventListener("keydown", handleKeyPress);
  }

  function componentWillUnmount() {
    console.log("Component will unmount");
    window.removeEventListener("keydown", handleKeyPress);
  }

  function handleKeyPress(event: any) {
    // TODO: remove secondary keys and replace by arrows
    if (event.key === "q") {
      socket.emit("up");
    } else if (event.key === "a") {
      socket.emit("down");
    } else if (event.key === "o") {
      socket.emit("up2");
    } else if (event.key === "l") {
      socket.emit("down2");
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
