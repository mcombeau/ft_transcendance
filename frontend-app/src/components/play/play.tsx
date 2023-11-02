import { useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
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
  const [cookies] = useCookies(["token"]);

  function componentDidMount(cookies: any) {
    console.log("Component did mount");
    window.addEventListener("keydown", (event) => {
      handleKeyPress(event, cookies);
    });
  }

  function componentWillUnmount(cookies: any) {
    console.log("Component will unmount");
    window.removeEventListener("keydown", (event) => {
      handleKeyPress(event, cookies);
    });
  }

  function handleKeyPress(event: any, cookies: any) {
    // TODO: remove secondary keys and replace by arrows
    if (event.key === "q") {
      socket.emit("up", cookies["token"]);
    } else if (event.key === "a") {
      socket.emit("down", cookies["token"]);
    } else if (event.key === "o") {
      socket.emit("up2", cookies["token"]);
    } else if (event.key === "l") {
      socket.emit("down2", cookies["token"]);
    }
  }

  useEffect(() => {
    console.log("Init socket");
    socket.on("tick", (data: any) => {
      console.log(data);
      console.log("received tick from gameroowm", data.gameRoomID);
      setState(data.gameState);
    });
    return () => {
      console.log("Unregistering sockets");
      socket.off("tick");
    };
  }, []);

  useEffect(() => {
    componentDidMount(cookies);
    return () => {
      componentWillUnmount(cookies);
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
