import { Timestamp } from "firebase/firestore";

export interface Game {
  home: string;
  away: string;
  winner: string | null;
  startTime: string;
}

export interface Week {
  week: string;
  firstGameStartTime: Timestamp;
  lastGameEndTime: Timestamp;
  games: Game[];
}

export interface Participant {
  uid: string;
  displayName: string;
  pick?: string;
  eliminated: boolean;
  eliminatedWeek: number;
}
