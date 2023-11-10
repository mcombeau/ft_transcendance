import { useEffect, useState } from "react";
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
  const splitDate = game.date.toString().split("T");
  const dateString = splitDate[0] + " " + splitDate[1].split(".")[0];
  return (
    <p>
      {game.didIWin ? "Won" : "Lost"} game against{" "}
      <a href={"/user/" + game.otherPlayerID}>{game.otherPlayerName}</a> :{" "}
      {game.myScore} - {game.otherPlayerScore} ({dateString})
    </p>
  );
}

function displayGames(games: Game[]) {
  if (games === undefined) return <div></div>;
  return games
    .sort(
      (a: Game, b: Game) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .map(displayGame);
}

function displayStats(games: Game[]) {
  if (games === undefined) return <div></div>;
  const nbWins = games.filter((game: Game) => game.didIWin === true).length;
  const nbLose = games.filter((game: Game) => game.didIWin === false).length;
  const winrate = nbWins / games.length;
  const averageScore =
    games.map((game: Game) => game.myScore).reduce((p, c) => p + c, 0) /
    games.length;
  return (
    <div>
      <p>Played games : {games.length}</p>
      <p>Won games : {nbWins}</p>
      <p>Lost games : {nbLose}</p>
      <p>Win Rate : {isNaN(winrate) ? "-" : winrate.toFixed(2)}</p>
      <p>
        Average Score : {isNaN(averageScore) ? "-" : averageScore.toFixed(2)}
      </p>
    </div>
  );
}

function GameHistory(user: User, cookies: any) {
  const [games, setGames] = useState<Game[]>();

  async function fetchGames(userID: number, cookies: any) {
    var request = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies["token"]}`,
      },
    };
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

  if (user === undefined) {
    return <div></div>;
  }

  return (
    <div>
      <h3>History:</h3>
      {displayGames(games)}
      <h3>Stats:</h3>
      {displayStats(games)}
    </div>
  );
}

export default GameHistory;
