import { useEffect, useState } from "react";
import { getUserID } from "../../cookies";
import { User } from "./profile";

export type Game = {
  didIWin: boolean;
  otherPlayerID: number;
  otherPlayerName: string;
  date: Date;
  myScore: number;
  otherPlayerScore: number;
};

function displayGame(game: Game) {
  return (
    <p>
      {game.didIWin ? "Won" : "Lost"} game against {game.otherPlayerName} :{" "}
      {game.myScore} - {game.otherPlayerScore} ({game.date.toString()})
    </p>
  );
}

function displayGames(games: Game[]) {
  if (games === undefined) return <div></div>;
  return games.map(displayGame);
}

function History(isMyPage: boolean, user: User, cookies: any) {
  const [games, setGames] = useState<Game[]>();

  async function fetchGames(userID: number, cookies: any) {
    var request = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies["token"]}`,
      },
    };
    console.log("FETCH");
    fetch(`http://localhost:3001/users/${userID}/games`, request).then(
      async (response) => {
        const gamesData = await response.json();
        if (!response.ok) {
          console.log("error response load games");
          return <h1>No Games loaded</h1>;
        }
        var fetchedGames = gamesData.map((fetchedGame: any) => {
          const didIWin = fetchedGame.winnerID === userID ? true : false;
          var newGame: Game = {
            didIWin: didIWin,
            otherPlayerID: didIWin ? fetchedGame.loserID : fetchedGame.winnerID,
            otherPlayerName: didIWin
              ? fetchedGame.loserUsername
              : fetchedGame.winnerUsername,
            date: fetchedGame.createdAt,
            myScore: didIWin ? fetchedGame.winnerScore : fetchedGame.loserScore,
            otherPlayerScore: didIWin
              ? fetchedGame.loserScore
              : fetchedGame.winnerScore,
          };
          return newGame;
        });
        setGames([...fetchedGames]);
      }
    );
  }

  useEffect(() => {
    if (user !== undefined) {
      fetchGames(user.id, cookies);
    }
  }, [user]);

  useEffect(() => {
    console.log("Games", games);
  }, [games]);

  if (user === undefined) {
    return <div>USER IS UNDEFINED</div>;
  }

  return (
    <div>
      <h3>History:</h3>
      {displayGames(games)}
    </div>
  );
}

export default History;
