import { useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import { AuthenticationContext } from "../authenticationState";
import "./styles.css";

const UP = 38;
const DOWN = 40;

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

enum StatePlay {
  OnPage,
  InLobby,
  InGame,
}

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
  const [player1Username, setPlayer1Username] = useState("");
  const [player2Username, setPlayer2Username] = useState("");
  const [statePlay, setStatePlay] = useState(StatePlay.OnPage);
  const { authenticatedUserID } = useContext(AuthenticationContext);

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
    if (statePlay === StatePlay.InGame) {
      if (event.key === "w" || event.key === UP) {
        socket.emit("up", cookies["token"]);
      } else if (event.key === "s" || event.key === DOWN) {
        socket.emit("down", cookies["token"]);
      }
    }
  }

  function enterLobby() {
    console.log("Entered Lobby");
    setStatePlay(StatePlay.InLobby);
    socket.emit("waiting", cookies["token"]);
  }

  function startGame() {
    console.log("Game started");
    setStatePlay(StatePlay.InGame);
  }

  function leaveGame() {
    setStatePlay(StatePlay.OnPage);
    socket.emit("leave game", cookies["token"]);
  }

  useEffect(() => {
    socket.on("tick", (data: any) => {
      // TODO: maybe ask back if already in game rather than wait for tick
      setStatePlay(StatePlay.InGame);
      setPlayer1Username(data.player1Username);
      setPlayer2Username(data.player2Username);
      setState(data.gameState);
    });

    socket.on("start game", () => {
      console.log("Starting game");
      setStatePlay(StatePlay.InGame);
    });

    socket.on("leave game", (userID: number) => {
      if (userID !== authenticatedUserID) {
        console.log("The other player left the game");
        alert("Game ended because the other player left");
        setStatePlay(StatePlay.OnPage);
      }
    });
    return () => {
      socket.off("tick");
      socket.off("start game");
      socket.off("leave game");
    };
  }, []);

  useEffect(() => {
    componentDidMount(cookies);
    return () => {
      componentWillUnmount(cookies);
    };
  }, []);

  if (statePlay === StatePlay.OnPage) {
    return (
      <div>
        <button onClick={enterLobby}>Play</button>
      </div>
    );
  }
  if (statePlay === StatePlay.InLobby) {
    return <div>Waiting for other player</div>;
  }

  return (
    <div className="App">
      <div className="center-container">
        <div className="result">
          <span className="res1">
            {player1Username} - {state.result[0]}
          </span>
          :
          <span className="res2">
            {player2Username} - {state.result[1]}
          </span>
          <span>
            <button onClick={leaveGame}>Leave</button>
          </span>
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
