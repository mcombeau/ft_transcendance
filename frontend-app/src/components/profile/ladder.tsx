export enum LadderLevels {
	Platinum = 100,
	Diamond = 50,
	Gold = 25,
	Silver = 15,
	Copper = 5,
	Wood = 0,
}

export function getLadderLevel(nbWins: number) {
	if (nbWins < LadderLevels.Copper) return LadderLevels.Wood;
	if (nbWins < LadderLevels.Silver) return LadderLevels.Copper;
	if (nbWins < LadderLevels.Gold) return LadderLevels.Silver;
	if (nbWins < LadderLevels.Diamond) return LadderLevels.Gold;
	if (nbWins < LadderLevels.Platinum) return LadderLevels.Diamond;
	return LadderLevels.Platinum;
}

export function getLadderLevelDescription(nbWins: number) {
	switch (getLadderLevel(nbWins)) {
		case LadderLevels.Platinum:
			return "Platinum";
		case LadderLevels.Diamond:
			return "Diamond";
		case LadderLevels.Gold:
			return "Gold";
		case LadderLevels.Silver:
			return "Silver";
		case LadderLevels.Copper:
			return "Copper";
		default:
			return "Wood";
	}
}
