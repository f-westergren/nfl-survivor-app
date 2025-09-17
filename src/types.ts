// types.ts
export interface Game {
	home: string;
	away: string;
	winner: string | null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	startTime: any; // Firestore Timestamp or Date string
}

export interface Week {
	week: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	firstGameStartTime: any;
	lastGameEndTime: any;
	games: Game[];
}

export interface Participant {
	uid: string;
	displayName: string;
	eliminated: boolean;
	pick?: string;
}
