export type createGameParams = {
    winnerName: string;
    loserName: string;
    winnerScore: number;
    loserScore: number;
};

export type updateGameParams = {
    winnerName: string;
    loserName: string;
    winnerScore: number;
    loserScore: number;
};

export type highScoreParams = {
    username: string,
    highscore: number
}