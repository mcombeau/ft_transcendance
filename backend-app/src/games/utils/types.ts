export type createGameParams = {
	winnerID: number;
	winnerUsername?: string;
	loserID: number;
	loserUsername?: string;
	winnerScore: number;
	loserScore: number;
};

export type updateGameParams = {
	winnerID: number;
	loserID: number;
	winnerScore: number;
	loserScore: number;
};
